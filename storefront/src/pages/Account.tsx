import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api/client";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import StoreLayout from "../components/StoreLayout";
import { useStoreSlug, useStoreBasePath } from "../context/ResolvedSlugContext";

interface OrderRow {
  _id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
}

export default function Account() {
  const slug = useStoreSlug();
  const basePath = useStoreBasePath();
  const { customer } = useCustomerAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug || !customer) return;
    api.get(`/public/stores/${slug}/auth/my-orders`).then(({ data }) => setOrders(data.orders));
    setLoading(false);
  }, [slug, customer]);

  if (!customer) return <Navigate to={`${basePath}/login`} replace />;

  return (
    <StoreLayout>
      {() => (
        <div className="cart-page">
          <h1>My account</h1>
          <div className="panel" style={{ marginBottom: 24 }}>
            <p style={{ margin: 0 }}>
              <strong>{customer.name}</strong>
            </p>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              {customer.phone} {customer.email && `· ${customer.email}`}
            </p>
          </div>

          <h3 style={{ marginBottom: 14 }}>Order history</h3>
          {loading ? (
            <p>Loading...</p>
          ) : orders.length === 0 ? (
            <div className="empty-state-store">
              <p>No orders yet.</p>
            </div>
          ) : (
            <div className="cart-items">
              {orders.map((o) => (
                <a key={o._id} href={`${basePath}/order/${o.orderNumber}?phone=${encodeURIComponent(customer.phone)}`} className="row-between" style={{ borderBottom: "1px solid var(--line)", padding: "14px 0", textDecoration: "none", color: "inherit" }}>
                  <span>
                    #{o.orderNumber} <span className="muted">· {new Date(o.createdAt).toLocaleDateString()}</span>
                  </span>
                  <span>
                    NPR {o.total.toLocaleString()} <span className="badge-outline" style={{ marginLeft: 8 }}>{o.status}</span>
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </StoreLayout>
  );
}
