import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { api } from "../api/client";

interface Member { id: string; name: string; email: string; role: string }

export default function StoreUsers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "staff" });
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await api.get("/store-users");
    setMembers(data.members);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setTempPassword(null);
    try {
      const { data } = await api.post("/store-users/invite", form);
      if (data.tempPassword) setTempPassword(data.tempPassword);
      setForm({ name: "", email: "", role: "staff" });
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to invite");
    }
  }

  async function handleRemove(id: string) {
    await api.delete(`/store-users/${id}`);
    load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Store Users</h1>
        <button className="primary-btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ Invite user"}
        </button>
      </div>

      {tempPassword && (
        <div className="empty-state" style={{ background: "#f3effe", borderStyle: "solid" }}>
          <p>
            New account created. Share this temporary password with them — it won't be shown again:{" "}
            <strong>{tempPassword}</strong>
          </p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleInvite} className="inline-form">
          {error && <p className="error">{error}</p>}
          <div className="inline-form-fields">
            <label>
              Name
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </label>
            <label>
              Role
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                <option value="staff">staff</option>
                <option value="admin">admin</option>
              </select>
            </label>
          </div>
          <button className="primary-btn" type="submit">Invite</button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.email}</td>
                <td><span className="badge">{m.role}</span></td>
                <td>{m.role !== "owner" && <button onClick={() => handleRemove(m.id)}>Remove</button>}</td>
              </tr>
            ))}
            {members.length === 0 && <tr><td colSpan={4} className="muted">No team members yet.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
