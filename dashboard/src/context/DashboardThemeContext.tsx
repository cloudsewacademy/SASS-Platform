import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";

export type DashboardMode = "light" | "dark";
export type DashboardAccent = "violet" | "blue" | "emerald" | "rose" | "amber";
export type SidebarDensity = "comfortable" | "compact";

interface DashboardThemeState {
  mode: DashboardMode;
  accent: DashboardAccent;
  density: SidebarDensity;
  setMode: (m: DashboardMode) => void;
  setAccent: (a: DashboardAccent) => void;
  setDensity: (d: SidebarDensity) => void;
}

const ACCENT_COLORS: Record<DashboardAccent, { base: string; dark: string; light: string }> = {
  violet: { base: "#7c3aed", dark: "#5b21b6", light: "#f3effe" },
  blue: { base: "#2563eb", dark: "#1e40af", light: "#eff4ff" },
  emerald: { base: "#059669", dark: "#065f46", light: "#ecfdf5" },
  rose: { base: "#e11d48", dark: "#9f1239", light: "#fff1f2" },
  amber: { base: "#d97706", dark: "#92400e", light: "#fffbeb" },
};

const DashboardThemeContext = createContext<DashboardThemeState | null>(null);

/**
 * This is the admin/merchant DASHBOARD's own UI theme (dark mode, accent
 * color, sidebar density) — deliberately separate from the tenant
 * storefront theming in Appearance (which controls the PUBLIC store's
 * look). A merchant working late might want dark mode in their own admin
 * panel without that having any effect on what customers see on the
 * storefront, so this preference is stored per-browser (localStorage),
 * not in the tenant's Settings document.
 */
export function DashboardThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DashboardMode>(() => (localStorage.getItem("dashboardMode") as DashboardMode) || "light");
  const [accent, setAccentState] = useState<DashboardAccent>(
    () => (localStorage.getItem("dashboardAccent") as DashboardAccent) || "violet"
  );
  const [density, setDensityState] = useState<SidebarDensity>(
    () => (localStorage.getItem("dashboardDensity") as SidebarDensity) || "comfortable"
  );

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-dashboard-mode", mode);
    root.setAttribute("data-dashboard-density", density);
    const colors = ACCENT_COLORS[accent];
    root.style.setProperty("--purple", colors.base);
    root.style.setProperty("--purple-dark", colors.dark);
    root.style.setProperty("--purple-light", colors.light);
  }, [mode, accent, density]);

  const setMode = useCallback((m: DashboardMode) => {
    localStorage.setItem("dashboardMode", m);
    setModeState(m);
  }, []);
  const setAccent = useCallback((a: DashboardAccent) => {
    localStorage.setItem("dashboardAccent", a);
    setAccentState(a);
  }, []);
  const setDensity = useCallback((d: SidebarDensity) => {
    localStorage.setItem("dashboardDensity", d);
    setDensityState(d);
  }, []);

  return (
    <DashboardThemeContext.Provider value={{ mode, accent, density, setMode, setAccent, setDensity }}>
      {children}
    </DashboardThemeContext.Provider>
  );
}

export function useDashboardTheme() {
  const ctx = useContext(DashboardThemeContext);
  if (!ctx) throw new Error("useDashboardTheme must be used within DashboardThemeProvider");
  return ctx;
}

export const DASHBOARD_ACCENTS = ACCENT_COLORS;
