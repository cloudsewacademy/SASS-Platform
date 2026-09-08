import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import StoreLayout from "../components/StoreLayout";
import { useStoreBasePath } from "../context/ResolvedSlugContext";

export default function Login() {
  const basePath = useStoreBasePath();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useCustomerAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(phone, password);
      const redirect = searchParams.get("redirect");
      navigate(redirect ? `${basePath}/${redirect}` : basePath || "/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
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
              Log in
            </h2>
            {error && <p className="error">{error}</p>}
            <label>
              Phone number
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            <button className="buy-btn" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? "Logging in..." : "Log in"}
            </button>
            <p className="muted" style={{ marginTop: 4 }}>
              New here? <Link to={`${basePath}/register${searchParams.get("redirect") ? `?redirect=${searchParams.get("redirect")}` : ""}`}>Create an account</Link>
            </p>
          </form>
        </div>
      )}
    </StoreLayout>
  );
}
