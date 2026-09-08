import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useCrud } from "../api/useCrud";
import ImageUploadField from "./ImageUploadField";

interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "number" | "email" | "textarea" | "select" | "checkbox" | "image";
  options?: string[];
  required?: boolean;
}

interface ColumnDef<T> {
  header: string;
  render: (item: T) => ReactNode;
}

interface Props<T extends { _id: string }> {
  resource: string;
  title: string;
  fields: FieldDef[];
  columns: ColumnDef<T>[];
  emptyLabel?: string;
}

export default function SimpleCrudPage<T extends { _id: string }>({
  resource,
  title,
  fields,
  columns,
  emptyLabel,
}: Props<T>) {
  const { items, loading, error, create, remove } = useCrud<T>(resource);
  const [form, setForm] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function update(name: string, value: string) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const f of fields) {
        if (f.type === "checkbox") {
          payload[f.name] = form[f.name] === "true";
          continue;
        }
        if (form[f.name] === undefined || form[f.name] === "") continue;
        payload[f.name] = f.type === "number" ? Number(form[f.name]) : form[f.name];
      }
      await create(payload as Partial<T>);
      setForm({});
      setShowForm(false);
    } catch (err: any) {
      const details = err.response?.data?.details?.fieldErrors;
      const detailMsg = details
        ? Object.entries(details)
            .filter(([, v]) => Array.isArray(v) && (v as string[]).length)
            .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
            .join(" · ")
        : null;
      setSubmitError(detailMsg || err.response?.data?.error || "Failed to create");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{title}</h1>
        <button className="primary-btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : `+ Add ${title.replace(/s$/, "")}`}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="inline-form">
          {submitError && <p className="error">{submitError}</p>}
          <div className="inline-form-fields">
            {fields.map((f) => (
              <label key={f.name}>
                {f.label}
                {f.type === "select" ? (
                  <select value={form[f.name] ?? ""} onChange={(e) => update(f.name, e.target.value)} required={f.required}>
                    <option value="">Select...</option>
                    {f.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : f.type === "checkbox" ? (
                  <input
                    type="checkbox"
                    checked={form[f.name] === "true"}
                    onChange={(e) => update(f.name, e.target.checked ? "true" : "false")}
                    style={{ width: 18, height: 18, marginTop: 4 }}
                  />
                ) : f.type === "image" ? (
                  <ImageUploadField value={form[f.name] ?? ""} onChange={(url) => update(f.name, url)} label="" />
                ) : f.type === "textarea" ? (
                  <textarea value={form[f.name] ?? ""} onChange={(e) => update(f.name, e.target.value)} required={f.required} rows={3} />
                ) : (
                  <input
                    type={f.type ?? "text"}
                    value={form[f.name] ?? ""}
                    onChange={(e) => update(f.name, e.target.value)}
                    required={f.required}
                  />
                )}
              </label>
            ))}
          </div>
          <button className="primary-btn" type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </button>
        </form>
      )}

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.header}>{c.header}</th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                {columns.map((c) => (
                  <td key={c.header}>{c.render(item)}</td>
                ))}
                <td>
                  <button onClick={() => remove(item._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="muted">
                  {emptyLabel || "No records yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
