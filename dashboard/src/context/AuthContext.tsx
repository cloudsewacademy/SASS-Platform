import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { api } from "../api/client";

interface TenantSummary {
  slug: string;
  storeName: string;
  plan: string;
  status: string;
}

interface AuthState {
  user: { id: string; name: string; email: string } | null;
  tenants: TenantSummary[];
  activeTenantSlug: string | null;
  login: (email: string, password: string) => Promise<"admin" | "merchant">;
  applyMerchantSession: (data: { token: string; user: AuthState["user"]; tenants: TenantSummary[] }) => void;
  register: (payload: { name: string; email: string; password: string; storeName: string }) => Promise<void>;
  logout: () => void;
  switchStore: (slug: string) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [activeTenantSlug, setActiveTenantSlug] = useState<string | null>(
    localStorage.getItem("activeTenantSlug")
  );

  const applyMerchantSession = useCallback(
    (data: { token: string; user: AuthState["user"]; tenants: TenantSummary[] }) => {
      localStorage.setItem("token", data.token);
      setUser(data.user);
      setTenants(data.tenants);
      if (data.tenants[0]) {
        localStorage.setItem("activeTenantSlug", data.tenants[0].slug);
        setActiveTenantSlug(data.tenants[0].slug);
      }
    },
    []
  );

  /**
   * Kept for any caller that only ever expects a merchant login (none
   * currently, since Login.tsx now calls /auth/login directly and
   * branches on role itself) — retained as a thin convenience wrapper.
   */
  const login = useCallback(async (email: string, password: string): Promise<"admin" | "merchant"> => {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.role === "merchant") applyMerchantSession(data);
    return data.role;
  }, [applyMerchantSession]);

  const register = useCallback(
    async (payload: { name: string; email: string; password: string; storeName: string }) => {
      const { data } = await api.post("/auth/register", payload);
      localStorage.setItem("token", data.token);
      localStorage.setItem("activeTenantSlug", data.tenant.slug);
      setUser(data.user);
      setTenants([{ ...data.tenant, plan: "trial", status: "active" }]);
      setActiveTenantSlug(data.tenant.slug);
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("activeTenantSlug");
    setUser(null);
    setTenants([]);
    setActiveTenantSlug(null);
  }, []);

  const switchStore = useCallback((slug: string) => {
    localStorage.setItem("activeTenantSlug", slug);
    setActiveTenantSlug(slug);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, tenants, activeTenantSlug, login, applyMerchantSession, register, logout, switchStore }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
