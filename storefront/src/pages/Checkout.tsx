import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { api } from "../api/client";
import { useCart } from "../context/CartContext";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import { useStoreSlug, useStoreBasePath } from "../context/ResolvedSlugContext";
import StoreLayout from "../components/StoreLayout";

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  esewa: "eSewa",
  khalti: "Khalti",
  fonepay: "Fonepay",
};

export default function Checkout() {
  const slug = useStoreSlug();
  const basePath = useStoreBasePath();
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const { customer } = useCustomerAuth();

  const [address, setAddress] = useState({ line1: "", city: "", district: "" });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabledMethods, setEnabledMethods] = useState<string[]>(["cod"]);

  useEffect(() => {
    if (!slug) return;
    api.get(`/public/stores/${slug}`).then(({ data }) => {
      const methods = data.enabledPaymentMethods?.length ? data.enabledPaymentMethods : ["cod"];
      setEnabledMethods(methods);
      setPaymentMethod(methods[0]);
    });
  }, [slug]);

  // Checkout requires an account — redirect to login and bring them right
  // back here afterward instead of losing their place.
  if (!customer) {
    return <Navigate to={`${basePath}/login?redirect=checkout`} replace />;
  }

  function update(field: string, value: string) {
    setAddress((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.post(`/public/stores/${slug}/checkout`, {
        shippingAddress: { line1: address.line1, city: address.city, district: address.district || undefined },
        items: items.map((i) => ({ productId: i.productId, variantLabel: i.variantLabel, quantity: i.quantity })),
        paymentMethod,
        notes: notes || undefined,
      });
      clear();
      navigate(`${basePath}/order/${data.orderNumber}?phone=${encodeURIComponent(customer!.phone)}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to place order. Please check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <StoreLayout>
        {() => (
          <div className="empty-state-store">
            <p>Your cart is empty — add something before checking out.</p>
          </div>
        )}
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      {() => (
        <div className="checkout-page">
          <form onSubmit={handleSubmit} className="checkout-form">
            <h2>Delivering to</h2>
            {error && <p className="error">{error}</p>}
            <p className="muted" style={{ marginTop: -6 }}>
              Ordering as <strong>{customer.name}</strong> · {customer.phone}
            </p>
            <label>
              Address
              <input value={address.line1} onChange={(e) => update("line1", e.target.value)} required />
            </label>
            <div className="inline-form-fields">
              <label>
                City
                <input value={address.city} onChange={(e) => update("city", e.target.value)} required />
              </label>
              <label>
                District (optional)
                <input value={address.district} onChange={(e) => update("district", e.target.value)} />
              </label>
            </div>
            <label>
              Order notes (optional)
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>

            <h2>Payment method</h2>
            <div className="payment-options">
              {enabledMethods.map((m) => (
                <label key={m} className="payment-option">
                  <input type="radio" name="payment" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} />
                  {PAYMENT_LABELS[m] || m}
                </label>
              ))}
            </div>
            {paymentMethod !== "cod" && (
              <p className="muted">
                You'll be marked as pending payment; the store will confirm your {PAYMENT_LABELS[paymentMethod]} payment
                before dispatch.
              </p>
            )}

            <button className="buy-btn" type="submit" disabled={submitting} style={{ width: "100%", marginTop: 8 }}>
              {submitting ? "Placing order..." : `Place order — NPR ${subtotal.toLocaleString()}`}
            </button>
          </form>

          <div className="checkout-summary">
            <h3>Order summary</h3>
            {items.map((item) => (
              <div key={`${item.productId}-${item.variantLabel ?? ""}`} className="row-between">
                <span>
                  {item.name} {item.variantLabel && `(${item.variantLabel})`} × {item.quantity}
                </span>
                <span>NPR {(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="row-between" style={{ borderTop: "1px solid var(--line)", marginTop: 10, paddingTop: 10 }}>
              <strong>Subtotal</strong>
              <strong>NPR {subtotal.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      )}
    </StoreLayout>
  );
}
