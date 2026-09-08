import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import { api } from "../api/client";

export default function Login() {
  const { applyMerchantSession } = useAuth();
  const { applyAdminSession } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      if (data.role === "admin") {
        applyAdminSession(data);
        navigate("/admin/users");
      } else {
        applyMerchantSession(data);
        navigate("/home");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-card">
        <h1>Log in</h1>
        {error && <p className="error">{error}</p>}
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        <button disabled={loading} type="submit">
          {loading ? "Logging in..." : "Log in"}
        </button>
        <p>
          No store yet? <Link to="/register">Create one</Link>
        </p>
      </form>
    </div>
  );
}
