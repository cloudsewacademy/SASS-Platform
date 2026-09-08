import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { useCrud } from "../api/useCrud";
import { api } from "../api/client";

interface FormField {
  label: string;
  type: "text" | "email" | "phone" | "textarea" | "select";
  required: boolean;
  options?: string[];
}
interface CustomForm {
  _id: string;
  title: string;
  slug: string;
  fields: FormField[];
  createLead: boolean;
}
interface Submission {
  _id: string;
  values: Record<string, string>;
  createdAt: string;
}

const FIELD_TEMPLATES: Record<string, FormField[]> = {
  "Contact form": [
    { label: "Name", type: "text", required: true },
    { label: "Email", type: "email", required: true },
    { label: "Message", type: "textarea", required: true },
  ],
  "Enquiry form": [
    { label: "Name", type: "text", required: true },
    { label: "Phone", type: "phone", required: true },
    { label: "Product interested in", type: "text", required: false },
    { label: "Message", type: "textarea", required: false },
  ],
};

export default function Forms() {
  const { items, create, remove } = useCrud<CustomForm>("forms");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [createLead, setCreateLead] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewingForm, setViewingForm] = useState<CustomForm | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  function useTemplate(name: string) {
    setTitle(name);
    setFields(FIELD_TEMPLATES[name]);
  }

  function addField() {
    setFields((f) => [...f, { label: "", type: "text", required: false }]);
  }
  function updateField(i: number, patch: Partial<FormField>) {
    setFields((f) => f.map((field, idx) => (idx === i ? { ...field, ...patch } : field)));
  }
  function removeField(i: number) {
    setFields((f) => f.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await create({ title, fields, createLead } as Partial<CustomForm>);
      setTitle("");
      setFields([]);
      setShowForm(false);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create form");
    } finally {
      setSubmitting(false);
    }
  }

  async function viewSubmissions(form: CustomForm) {
    setViewingForm(form);
    const { data } = await api.get(`/forms/${form._id}/submissions`);
    setSubmissions(data.items);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Forms</h1>
        <button className="primary-btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ Add Form"}
        </button>
      </div>
      <p className="muted" style={{ marginBottom: 14 }}>
        Build a Contact, Enquiry, or any custom form. Add it to your storefront nav under Appearance →
        Navigation, pointing at <code>/form/&lt;form-slug&gt;</code>.
      </p>

      {showForm && (
        <form onSubmit={handleSubmit} className="inline-form">
          {error && <p className="error">{error}</p>}
          <div className="inline-form-fields">
            <button type="button" className="add-row-btn" onClick={() => useTemplate("Contact form")}>Use Contact template</button>
            <button type="button" className="add-row-btn" onClick={() => useTemplate("Enquiry form")}>Use Enquiry template</button>
          </div>
          <label>
            Form title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>

          <p className="form-section-title" style={{ borderTop: "none", paddingTop: 0 }}>Fields</p>
          {fields.map((f, i) => (
            <div key={i} className="builder-row">
              <input placeholder="Label" value={f.label} onChange={(e) => updateField(i, { label: e.target.value })} />
              <select value={f.type} onChange={(e) => updateField(i, { type: e.target.value as FormField["type"] })}>
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="textarea">Long text</option>
                <option value="select">Dropdown</option>
              </select>
              <label className="checkbox-label" style={{ flex: "none" }}>
                <input type="checkbox" checked={f.required} onChange={(e) => updateField(i, { required: e.target.checked })} />
                Required
              </label>
              <button type="button" onClick={() => removeField(i)} className="icon-btn"><Trash2 size={15} /></button>
            </div>
          ))}
          <button type="button" className="add-row-btn" onClick={addField}><Plus size={14} /> Add field</button>

          <label className="checkbox-label" style={{ marginTop: 8 }}>
            <input type="checkbox" checked={createLead} onChange={(e) => setCreateLead(e.target.checked)} />
            Also create a Lead from each submission
          </label>

          <button className="primary-btn" type="submit" disabled={submitting || fields.length === 0}>
            {submitting ? "Saving..." : "Save form"}
          </button>
        </form>
      )}

      {viewingForm && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="row-between">
            <h3 style={{ margin: 0 }}>Submissions — {viewingForm.title}</h3>
            <button onClick={() => setViewingForm(null)}>Close</button>
          </div>
          {submissions.length === 0 ? (
            <p className="muted">No submissions yet.</p>
          ) : (
            submissions.map((s) => (
              <div key={s._id} className="footer-col-editor">
                {Object.entries(s.values).map(([k, v]) => (
                  <div key={k} className="row-between">
                    <span className="muted">{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
                <p className="muted" style={{ marginTop: 6, marginBottom: 0 }}>
                  {new Date(s.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Slug</th>
            <th>Fields</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((f) => (
            <tr key={f._id}>
              <td>{f.title}</td>
              <td>{f.slug}</td>
              <td>{f.fields.length}</td>
              <td>
                <button onClick={() => viewSubmissions(f)}>Submissions</button>{" "}
                <button onClick={() => remove(f._id)}>Delete</button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={4} className="muted">
                No forms yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
