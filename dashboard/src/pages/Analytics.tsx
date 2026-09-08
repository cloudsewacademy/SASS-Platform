import { useEffect, useState } from "react";
import { api } from "../api/client";

interface Summary {
  totalRevenue: number;
  orderCount: number;
  productCount: number;
  ordersByStatus: Record<string, number>;
  ordersByChannel: Record<string, number>;
  last30Days: { _id: string; revenue: number; orders: number }[];
  topProducts: { _id: string; quantity: number; revenue: number }[];
}

export default function Analytics() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    api.get("/analytics/summary").then(({ data }) => setSummary(data));
  }, []);

  if (!summary) return <div className="page"><p>Loading...</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Analytics</h1>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-value">NPR {summary.totalRevenue.toLocaleString()}</span>
          <span className="muted">Total revenue</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{summary.orderCount}</span>
          <span className="muted">Total orders</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{summary.productCount}</span>
          <span className="muted">Products</span>
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <h3>Orders by status</h3>
          {Object.entries(summary.ordersByStatus).map(([k, v]) => (
            <div key={k} className="row-between">
              <span className="badge">{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
        <div className="panel">
          <h3>Orders by channel</h3>
          {Object.entries(summary.ordersByChannel).map(([k, v]) => (
            <div key={k} className="row-between">
              <span className="badge">{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3>Top products (by units sold)</h3>
        {summary.topProducts.length === 0 ? (
          <p className="muted">No sales data yet.</p>
        ) : (
          summary.topProducts.map((p) => (
            <div key={p._id} className="row-between">
              <span>{p._id}</span>
              <span>{p.quantity} sold · NPR {p.revenue.toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
