import { useState } from "react";
import type { FormEvent } from "react";
import { useCrud } from "../api/useCrud";

interface Page {
  _id: string;
  title: string;
  slug: string;
  content: string;
  status: "draft" | "published";
  showInNav: boolean;
}

export default function PagesManager() {
  const { items, loading, create, update, remove } = useCrud<Page>("pages");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", status: "draft" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await create(form as Partial<Page>);
      setForm({ title: "", content: "", status: "draft" });
      setShowForm(false);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create page");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Pages</h1>
        <button className="primary-btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ Add Page"}
        </button>
      </div>

      <p className="muted" style={{ marginBottom: 14 }}>
        Published pages with "Show in nav" checked automatically appear in your storefront's navigation
        menu. You can also add custom links (not tied to a page) under Appearance → Navigation.
      </p>

      {showForm && (
        <form onSubmit={handleSubmit} className="inline-form">
          {error && <p className="error">{error}</p>}
          <div className="inline-form-fields">
            <label>
              Title
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            </label>
            <label style={{ flex: 2 }}>
              Content
              <textarea
                rows={4}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </label>
          </div>
          <button className="primary-btn" type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save page"}
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Show in nav</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p._id}>
                <td>{p.title}</td>
                <td>{p.slug}</td>
                <td>
                  <select value={p.status} onChange={(e) => update(p._id, { status: e.target.value as any })}>
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                  </select>
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={p.showInNav}
                    onChange={(e) => update(p._id, { showInNav: e.target.checked })}
                  />
                </td>
                <td>
                  <button onClick={() => remove(p._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  No pages yet — try adding an "About Us" or "Contact" page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
