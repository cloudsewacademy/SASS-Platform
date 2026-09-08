import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";

interface Order {
  _id: string;
  orderNumber: string;
  customer: { name: string; phone: string };
  items: { name: string; quantity: number; unitPrice: number }[];
  total: number;
  status: string;
  channel: string;
  createdAt: string;
}

const STATUSES = ["pending", "confirmed", "processing", "dispatched", "delivered", "cancelled"];

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get("/orders", {
      params: { status: statusFilter || undefined, search: search || undefined },
    });
    setOrders(data.orders);
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: string) {
    await api.patch(`/orders/${id}/status`, { status });
    load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Orders</h1>
        <div className="filters">
          <input
            placeholder="Search order #, name, phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Channel</th>
              <th>Status</th>
              <th>Placed</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td>{o.orderNumber}</td>
                <td>
                  {o.customer.name}
                  <br />
                  <span className="muted">{o.customer.phone}</span>
                </td>
                <td>{o.items.map((i) => `${i.name} x${i.quantity}`).join(", ")}</td>
                <td>NPR {o.total.toLocaleString()}</td>
                <td>{o.channel}</td>
                <td>
                  <select value={o.status} onChange={(e) => updateStatus(o._id, e.target.value)}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="muted">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
