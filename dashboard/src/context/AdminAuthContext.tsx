import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { adminApi } from "../api/adminClient";

interface AdminInfo {
  id: string;
  name: string;
  email: string;
}

interface AdminAuthState {
  admin: AdminInfo | null;
  login: (email: string, password: string) => Promise<void>;
  applyAdminSession: (data: { token: string; admin: AdminInfo }) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthState | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminInfo | null>(null);

  const applyAdminSession = useCallback((data: { token: string; admin: AdminInfo }) => {
    localStorage.setItem("adminToken", data.token);
    setAdmin(data.admin);
  }, []);

  // Retained for the (now unused by the unified Login page, but still
  // valid) case of hitting the admin-only endpoint directly.
  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await adminApi.post("/admin/login", { email, password });
      applyAdminSession(data);
    },
    [applyAdminSession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("adminToken");
    setAdmin(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, login, applyAdminSession, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
