import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", storeName: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(form);
      navigate("/home");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-card">
        <h1>Create your store</h1>
        {error && <p className="error">{error}</p>}
        <label>
          Your name
          <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
        </label>
        <label>
          Store name
          <input value={form.storeName} onChange={(e) => update("storeName", e.target.value)} required />
        </label>
        <label>
          Email
          <input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            type="password"
            minLength={8}
            required
          />
        </label>
        <button disabled={loading} type="submit">
          {loading ? "Creating..." : "Create store"}
        </button>
        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
