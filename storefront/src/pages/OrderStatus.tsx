import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import StoreLayout from "../components/StoreLayout";
import { useStoreSlug } from "../context/ResolvedSlugContext";

interface Order {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  items: { name: string; quantity: number; unitPrice: number; variantLabel?: string }[];
  shippingAddress?: { line1: string; city: string };
  createdAt: string;
}

const STATUS_STEPS = ["pending", "confirmed", "processing", "dispatched", "delivered"];

export default function OrderStatus() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const slug = useStoreSlug();
  const [searchParams] = useSearchParams();
  const [phone, setPhone] = useState(searchParams.get("phone") || "");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function track(phoneToUse: string) {
    if (!slug || !orderNumber || !phoneToUse) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/public/stores/${slug}/orders/track`, {
        params: { orderNumber, phone: phoneToUse },
      });
      setOrder(data);
    } catch {
      setError("No order found with that order number and phone number.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (searchParams.get("phone")) track(searchParams.get("phone")!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1;

  return (
    <StoreLayout>
      {() => (
        <div className="order-status-page">
          <h1>Track your order</h1>
          <p className="muted">Order #{orderNumber}</p>

          {!order && (
            <div className="panel" style={{ maxWidth: 380 }}>
              <label>
                Phone number used at checkout
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <button className="buy-btn" style={{ marginTop: 10 }} onClick={() => track(phone)} disabled={loading}>
                {loading ? "Checking..." : "Track order"}
              </button>
              {error && <p className="error" style={{ marginTop: 10 }}>{error}</p>}
            </div>
          )}

          {order && order.status !== "cancelled" && (
            <div className="order-progress">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className={`progress-step ${i <= stepIndex ? "done" : ""}`}>
                  <span className="progress-dot" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}
          {order && order.status === "cancelled" && <p className="badge-outline">Order cancelled</p>}

          {order && (
            <div className="panel" style={{ marginTop: 20 }}>
              <h3 style={{ marginTop: 0 }}>Order details</h3>
              {order.items.map((item, i) => (
                <div key={i} className="row-between">
                  <span>
                    {item.name} {item.variantLabel && `(${item.variantLabel})`} × {item.quantity}
                  </span>
                  <span>NPR {(item.unitPrice * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="row-between" style={{ marginTop: 8, fontWeight: 700 }}>
                <span>Total</span>
                <span>NPR {order.total.toLocaleString()}</span>
              </div>
              <p className="muted" style={{ marginTop: 10 }}>
                Payment: {order.paymentMethod.toUpperCase()} · {order.paymentStatus}
              </p>
              {order.shippingAddress && (
                <p className="muted">
                  Delivering to: {order.shippingAddress.line1}, {order.shippingAddress.city}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </StoreLayout>
  );
}
