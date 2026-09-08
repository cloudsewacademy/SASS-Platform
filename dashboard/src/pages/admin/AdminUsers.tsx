import { useEffect, useState, useCallback } from "react";
import { adminApi } from "../../api/adminClient";

interface Store {
  storeName: string;
  slug: string;
  plan: string;
  status: string;
  role: string;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  stores: Store[];
}

interface Stats {
  totalUsers: number;
  totalTenants: number;
  tenantsByPlan: Record<string, number>;
  tenantsByStatus: Record<string, number>;
}

interface Activity {
  orderCount: number;
  totalRevenue: number;
  publishedProductCount: number;
  lastOrderAt: string | null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activityFor, setActivityFor] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [usersRes, statsRes] = await Promise.all([
      adminApi.get("/admin/users", { params: { search: search || undefined } }),
      adminApi.get("/admin/stats"),
    ]);
    setUsers(usersRes.data.users);
    setStats(statsRes.data);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleSuspend(currentStatus: string, tenantId: string) {
    const next = currentStatus === "suspended" ? "active" : "suspended";
    await adminApi.patch(`/admin/tenants/${tenantId}/status`, { status: next });
    load();
  }

  async function viewActivity(tenantId: string, storeName: string) {
    setActivityFor(storeName);
    setActivity(null);
    setActivityLoading(true);
    const { data } = await adminApi.get(`/admin/tenants/${tenantId}/activity`);
    setActivity(data);
    setActivityLoading(false);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Registered users</h1>
        <input placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {stats && (
        <div className="stat-cards">
          <div className="stat-card">
            <span className="stat-value">{stats.totalUsers}</span>
            <span className="muted">Users</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.totalTenants}</span>
            <span className="muted">Stores</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.tenantsByStatus.active || 0}</span>
            <span className="muted">Active stores</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.tenantsByStatus.suspended || 0}</span>
            <span className="muted">Suspended</span>
          </div>
        </div>
      )}

      <p className="muted" style={{ marginBottom: 12 }}>
        Passwords and store data (orders, products, customers) are never visible here — this view only
        reads platform-level registration metadata, plus aggregate activity counts (order count, revenue,
        published product count) with no individual records ever exposed.
      </p>

      {activityFor && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="row-between">
            <h3 style={{ margin: 0 }}>Activity — {activityFor}</h3>
            <button onClick={() => setActivityFor(null)}>Close</button>
          </div>
          {activityLoading || !activity ? (
            <p className="muted">Loading...</p>
          ) : (
            <div className="stat-cards" style={{ marginTop: 12, marginBottom: 0 }}>
              <div className="stat-card">
                <span className="stat-value">{activity.orderCount}</span>
                <span className="muted">Orders</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">NPR {activity.totalRevenue.toLocaleString()}</span>
                <span className="muted">Revenue</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{activity.publishedProductCount}</span>
                <span className="muted">Published products</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">
                  {activity.lastOrderAt ? new Date(activity.lastOrderAt).toLocaleDateString() : "—"}
                </span>
                <span className="muted">Last order</span>
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Registered</th>
              <th>Stores</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  {u.stores.map((s: any) => (
                    <div key={s.slug} className="store-chip">
                      {s.storeName} <span className="muted">({s.plan}, {s.status})</span>{" "}
                      <button onClick={() => viewActivity(s._id, s.storeName)}>Activity</button>{" "}
                      <button onClick={() => toggleSuspend(s.status, (s as any)._id)}>
                        {s.status === "suspended" ? "Reactivate" : "Suspend"}
                      </button>
                    </div>
                  ))}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  No users registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
