import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import StoreLayout from "../components/StoreLayout";
import { useStoreBasePath } from "../context/ResolvedSlugContext";

export default function Register() {
  const basePath = useStoreBasePath();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useCustomerAuth();
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register({ ...form, email: form.email || undefined });
      const redirect = searchParams.get("redirect");
      navigate(redirect ? `${basePath}/${redirect}` : basePath || "/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <StoreLayout>
      {() => (
        <div className="auth-page-inner">
          <form onSubmit={handleSubmit} className="checkout-form" style={{ maxWidth: 380, margin: "40px auto" }}>
            <h2 style={{ fontSize: 20, textTransform: "none", letterSpacing: 0, fontFamily: "var(--font-serif)" }}>
              Create an account
            </h2>
            {error && <p className="error">{error}</p>}
            <label>
              Full name
              <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
            </label>
            <label>
              Phone number
              <input value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
            </label>
            <label>
              Email (optional)
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </label>
            <label>
              Password
              <input type="password" minLength={6} value={form.password} onChange={(e) => update("password", e.target.value)} required />
            </label>
            <button className="buy-btn" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? "Creating account..." : "Create account"}
            </button>
            <p className="muted" style={{ marginTop: 4 }}>
              Already have an account? <Link to={`${basePath}/login${searchParams.get("redirect") ? `?redirect=${searchParams.get("redirect")}` : ""}`}>Log in</Link>
            </p>
          </form>
        </div>
      )}
    </StoreLayout>
  );
}
