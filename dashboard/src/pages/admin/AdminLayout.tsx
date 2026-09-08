import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();

  if (!localStorage.getItem("adminToken")) return <Navigate to="/login" replace />;

  return (
    <div className="layout">
      <aside className="sidebar admin-sidebar">
        <h2 className="brand">Platform Admin</h2>
        <nav>
          <NavLink to="/admin/users">Users</NavLink>
          <NavLink to="/admin/landing-page">Landing Page</NavLink>
        </nav>
        <div className="sidebar-footer">
          <span className="muted">{admin?.email}</span>
          <button onClick={logout}>Log out</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
