import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { api } from "../api/client";

interface CustomerInfo {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface CustomerAuthState {
  customer: CustomerInfo | null;
  loading: boolean;
  register: (data: { name: string; phone: string; email?: string; password: string }) => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthState | null>(null);

/**
 * Customer sessions are scoped per store slug (separate localStorage key
 * and separate JWT, verified server-side against that slug) — logging
 * into Store A never logs you into Store B, since they're different
 * tenants with entirely separate customer databases.
 */
export function CustomerAuthProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const storageKey = `customerToken:${slug}`;
  const [customer, setCustomer] = useState<CustomerInfo | null>(() => {
    try {
      const raw = localStorage.getItem(`${storageKey}:profile`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading] = useState(false);

  function persist(token: string, profile: CustomerInfo) {
    localStorage.setItem(storageKey, token);
    localStorage.setItem(`${storageKey}:profile`, JSON.stringify(profile));
    setCustomer(profile);
  }

  const register = useCallback(
    async (data: { name: string; phone: string; email?: string; password: string }) => {
      const { data: res } = await api.post(`/public/stores/${slug}/auth/register`, data);
      persist(res.token, res.customer);
    },
    [slug]
  );

  const login = useCallback(
    async (phone: string, password: string) => {
      const { data: res } = await api.post(`/public/stores/${slug}/auth/login`, { phone, password });
      persist(res.token, res.customer);
    },
    [slug]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`${storageKey}:profile`);
    setCustomer(null);
  }, [storageKey]);

  return (
    <CustomerAuthContext.Provider value={{ customer, loading, register, login, logout }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return ctx;
}

export function getCustomerToken(slug: string): string | null {
  return localStorage.getItem(`customerToken:${slug}`);
}
