import { useEffect, useState } from "react";
import { api } from "../api/client";

interface OrderRow { _id: string; orderNumber: string; total: number; customer: { name: string }; createdAt: string }

export default function Finance() {
  const [tab, setTab] = useState<"received" | "settled" | "cod">("received");
  const [transactions, setTransactions] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [codPending, setCodPending] = useState<{ orders: OrderRow[]; total: number }>({ orders: [], total: 0 });
  const [codReconciled, setCodReconciled] = useState<{ orders: OrderRow[]; total: number }>({ orders: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (tab === "cod") {
      api.get("/finance/cod-reconciliation").then(({ data }) => {
        setCodPending(data.pending);
        setCodReconciled(data.reconciled);
        setLoading(false);
      });
    } else {
      api.get("/finance/transactions", { params: { type: tab } }).then(({ data }) => {
        setTransactions(data.transactions);
        setTotal(data.total);
        setLoading(false);
      });
    }
  }, [tab]);

  async function markPaid(orderId: string) {
    await api.patch(`/finance/cod-reconciliation/${orderId}/mark-paid`);
    const { data } = await api.get("/finance/cod-reconciliation");
    setCodPending(data.pending);
    setCodReconciled(data.reconciled);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Finance</h1>
      </div>

      <div className="tab-row">
        <button className={tab === "received" ? "tab active" : "tab"} onClick={() => setTab("received")}>Received</button>
        <button className={tab === "settled" ? "tab active" : "tab"} onClick={() => setTab("settled")}>Settled</button>
        <button className={tab === "cod" ? "tab active" : "tab"} onClick={() => setTab("cod")}>COD Reconciliation</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : tab === "cod" ? (
        <>
          <div className="stat-cards">
            <div className="stat-card">
              <span className="stat-value">NPR {codPending.total.toLocaleString()}</span>
              <span className="muted">Pending reconciliation</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">NPR {codReconciled.total.toLocaleString()}</span>
              <span className="muted">Reconciled</span>
            </div>
          </div>
          <h3 style={{ marginTop: 8 }}>Pending</h3>
          <table className="table">
            <thead><tr><th>Order #</th><th>Customer</th><th>Amount</th><th></th></tr></thead>
            <tbody>
              {codPending.orders.map((o) => (
                <tr key={o._id}>
                  <td>{o.orderNumber}</td>
                  <td>{o.customer.name}</td>
                  <td>NPR {o.total.toLocaleString()}</td>
                  <td><button onClick={() => markPaid(o._id)}>Mark reconciled</button></td>
                </tr>
              ))}
              {codPending.orders.length === 0 && <tr><td colSpan={4} className="muted">Nothing pending.</td></tr>}
            </tbody>
          </table>
        </>
      ) : (
        <>
          <div className="stat-cards">
            <div className="stat-card">
              <span className="stat-value">NPR {total.toLocaleString()}</span>
              <span className="muted">{tab === "received" ? "Total received" : "Total settled"}</span>
            </div>
          </div>
          <table className="table">
            <thead><tr><th>Order #</th><th>Customer</th><th>Amount</th><th>Date</th></tr></thead>
            <tbody>
              {transactions.map((o) => (
                <tr key={o._id}>
                  <td>{o.orderNumber}</td>
                  <td>{o.customer.name}</td>
                  <td>NPR {o.total.toLocaleString()}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {transactions.length === 0 && <tr><td colSpan={4} className="muted">No transactions yet.</td></tr>}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
