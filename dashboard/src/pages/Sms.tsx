import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../api/client";

interface SmsLog { _id: string; to: string; message: string; status: string; createdAt: string }

export default function Sms() {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data } = await api.get("/sms");
    setLogs(data.logs);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await api.post("/sms/send", { to, message });
      setTo("");
      setMessage("");
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>SMS</h1>
      </div>
      <p className="muted" style={{ marginBottom: 12 }}>
        No SMS gateway is connected yet — messages are logged here rather than actually delivered. Wire up a
        provider (e.g. Sparrow SMS) on the server to make this live.
      </p>

      <form onSubmit={handleSend} className="inline-form">
        {error && <p className="error">{error}</p>}
        <div className="inline-form-fields">
          <label>
            To (phone)
            <input value={to} onChange={(e) => setTo(e.target.value)} required />
          </label>
          <label style={{ flex: 2 }}>
            Message
            <input value={message} onChange={(e) => setMessage(e.target.value)} maxLength={480} required />
          </label>
        </div>
        <button className="primary-btn" type="submit" disabled={sending}>
          {sending ? "Sending..." : "Send"}
        </button>
      </form>

      <table className="table">
        <thead><tr><th>To</th><th>Message</th><th>Status</th><th>Sent</th></tr></thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l._id}>
              <td>{l.to}</td>
              <td>{l.message}</td>
              <td>{l.status}</td>
              <td>{new Date(l.createdAt).toLocaleString()}</td>
            </tr>
          ))}
          {logs.length === 0 && <tr><td colSpan={4} className="muted">No messages sent yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
