import { useEffect, useState } from "react";
import { DollarSign, ShoppingBag, Receipt } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, tenants, activeTenantSlug } = useAuth();
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [revenue, setRevenue] = useState<number | null>(null);

  const storeName = tenants.find((t) => t.slug === activeTenantSlug)?.storeName;

  useEffect(() => {
    api.get("/orders", { params: { limit: 100 } }).then(({ data }) => {
      setOrderCount(data.total);
      const sum = data.orders.reduce((acc: number, o: any) => acc + o.total, 0);
      setRevenue(sum);
    });
  }, [activeTenantSlug]);

  const avgOrderValue = orderCount && revenue ? Math.round(revenue / orderCount) : 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Good day, {user?.name?.split(" ")[0]}</h1>
          <p className="muted">{storeName ? `${storeName} — here's your snapshot` : "Here's your snapshot"}</p>
        </div>
        {activeTenantSlug && (
          <a
            className="primary-btn"
            href={`${import.meta.env.VITE_STOREFRONT_URL || "http://localhost:5174"}/${activeTenantSlug}`}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
          >
            Go to your website ↗
          </a>
        )}
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-icon stat-icon-purple">
            <DollarSign size={18} />
          </span>
          <span className="stat-value">NPR {(revenue ?? 0).toLocaleString()}</span>
          <span className="muted">Revenue</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon stat-icon-blue">
            <ShoppingBag size={18} />
          </span>
          <span className="stat-value">{orderCount ?? 0}</span>
          <span className="muted">Orders</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon stat-icon-pink">
            <Receipt size={18} />
          </span>
          <span className="stat-value">NPR {avgOrderValue.toLocaleString()}</span>
          <span className="muted">Average order value</span>
        </div>
      </div>

      <div className="empty-state">
        <p>More charts and insights land here as your order history builds up.</p>
      </div>
    </div>
  );
}
