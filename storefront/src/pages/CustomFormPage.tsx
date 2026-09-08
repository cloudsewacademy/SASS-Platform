import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import StoreLayout from "../components/StoreLayout";
import { useStoreSlug } from "../context/ResolvedSlugContext";

interface FormField {
  label: string;
  type: "text" | "email" | "phone" | "textarea" | "select";
  required: boolean;
  options?: string[];
}
interface FormDef {
  title: string;
  description?: string;
  fields: FormField[];
  successMessage: string;
}

export default function CustomFormPage() {
  const { formSlug } = useParams<{ formSlug: string }>();
  const slug = useStoreSlug();
  const [form, setForm] = useState<FormDef | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !formSlug) return;
    setLoading(true);
    api
      .get(`/public/stores/${slug}/forms/${formSlug}`)
      .then(({ data }) => setForm(data))
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug, formSlug]);

  function update(label: string, value: string) {
    setValues((v) => ({ ...v, [label]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.post(`/public/stores/${slug}/forms/${formSlug}/submit`, values);
      setSuccessMessage(data.successMessage);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StoreLayout>
      {() =>
        loading ? (
          <p>Loading...</p>
        ) : notFound || !form ? (
          <div className="empty-state-store">
            <p>This form doesn't exist.</p>
          </div>
        ) : successMessage ? (
          <div className="empty-state-store">
            <p>{successMessage}</p>
          </div>
        ) : (
          <div className="cms-page">
            <h1>{form.title}</h1>
            {form.description && <p>{form.description}</p>}
            <form onSubmit={handleSubmit} className="checkout-form" style={{ maxWidth: 480 }}>
              {error && <p className="error">{error}</p>}
              {form.fields.map((f) => (
                <label key={f.label}>
                  {f.label}
                  {f.type === "textarea" ? (
                    <textarea
                      rows={4}
                      required={f.required}
                      value={values[f.label] || ""}
                      onChange={(e) => update(f.label, e.target.value)}
                    />
                  ) : f.type === "select" ? (
                    <select
                      required={f.required}
                      value={values[f.label] || ""}
                      onChange={(e) => update(f.label, e.target.value)}
                    >
                      <option value="">Select...</option>
                      {f.options?.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.type === "email" ? "email" : f.type === "phone" ? "tel" : "text"}
                      required={f.required}
                      value={values[f.label] || ""}
                      onChange={(e) => update(f.label, e.target.value)}
                    />
                  )}
                </label>
              ))}
              <button className="buy-btn" type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </form>
          </div>
        )
      }
    </StoreLayout>
  );
}
