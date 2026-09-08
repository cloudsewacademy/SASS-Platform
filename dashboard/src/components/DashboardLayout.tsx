import { NavLink, Outlet, Navigate } from "react-router-dom";
import {
  Home, Users, Grid3x3, Tag, Gift, Boxes, Star, UserCircle2, ShoppingBag,
  Contact2, AlertCircle, MessageSquare, TicketPercent, LineChart, Image,
  Wallet, Layers, Plug, Palette, Settings, ChevronRight, Sun, Moon, FileText,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDashboardTheme, DASHBOARD_ACCENTS } from "../context/DashboardThemeContext";
import type { DashboardAccent } from "../context/DashboardThemeContext";

const mainLinks = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/store-users", label: "Store Users", icon: Users },
  { to: "/categories", label: "Categories", icon: Grid3x3 },
  { to: "/brands", label: "Brands", icon: Tag },
  { to: "/products", label: "Products", icon: Gift },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/customers", label: "Customers", icon: UserCircle2 },
  { to: "/orders", label: "Orders", icon: ShoppingBag },
  { to: "/leads", label: "Leads", icon: Contact2 },
  { to: "/issues", label: "Issues", icon: AlertCircle },
  { to: "/sms", label: "SMS", icon: MessageSquare },
  { to: "/coupons", label: "Discount Coupons", icon: TicketPercent },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/media", label: "Media", icon: Image },
  { to: "/finance", label: "Finance", icon: Wallet },
];

const customizationLinks = [
  { to: "/content", label: "Content", icon: Layers },
  { to: "/forms", label: "Forms", icon: FileText },
  { to: "/plugins", label: "Plugins", icon: Plug },
  { to: "/appearance", label: "Appearance", icon: Palette },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout() {
  const { user, tenants, activeTenantSlug, switchStore, logout } = useAuth();
  const { mode, accent, density, setMode, setAccent, setDensity } = useDashboardTheme();

  if (!localStorage.getItem("token")) return <Navigate to="/login" replace />;

  const activeStore = tenants.find((t) => t.slug === activeTenantSlug);
  const initials = (user?.name || "?").slice(0, 2).toUpperCase();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-user">
          <span className="avatar">{initials}</span>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name}</span>
            <span className="sidebar-user-role">OWNER</span>
          </div>
          <ChevronRight size={16} className="muted-icon" />
        </div>

        {tenants.length > 1 && (
          <select
            className="store-switcher"
            value={activeTenantSlug ?? ""}
            onChange={(e) => switchStore(e.target.value)}
          >
            {tenants.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.storeName}
              </option>
            ))}
          </select>
        )}
        {activeStore && tenants.length <= 1 && (
          <div className="active-store-label">{activeStore.storeName}</div>
        )}

        <nav className="nav-scroll">
          <p className="nav-section-label">Main Links</p>
          {mainLinks.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}

          <p className="nav-section-label">Customizations</p>
          {customizationLinks.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="theme-switcher">
            <button
              className="theme-mode-btn"
              onClick={() => setMode(mode === "dark" ? "light" : "dark")}
              title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {mode === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button
              className="theme-mode-btn"
              onClick={() => setDensity(density === "compact" ? "comfortable" : "compact")}
              title={density === "compact" ? "Comfortable layout" : "Compact layout"}
              style={{ fontSize: 10, fontWeight: 700 }}
            >
              {density === "compact" ? "C" : "N"}
            </button>
            <div className="accent-dots">
              {(Object.keys(DASHBOARD_ACCENTS) as DashboardAccent[]).map((a) => (
                <button
                  key={a}
                  className={a === accent ? "accent-dot active" : "accent-dot"}
                  style={{ background: DASHBOARD_ACCENTS[a].base }}
                  onClick={() => setAccent(a)}
                  title={a}
                />
              ))}
            </div>
          </div>
          <span className="muted">{user?.email}</span>
          <button onClick={logout}>Log out</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
