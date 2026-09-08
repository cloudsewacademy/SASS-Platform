import { useCrud } from "../api/useCrud";

interface Review {
  _id: string;
  customerName: string;
  rating: number;
  comment?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export default function Reviews() {
  const { items, loading, update, remove } = useCrud<Review>("reviews");

  return (
    <div className="page">
      <div className="page-header">
        <h1>Reviews</h1>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r._id}>
                <td>{r.customerName}</td>
                <td>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</td>
                <td>{r.comment || <span className="muted">—</span>}</td>
                <td>
                  <select value={r.status} onChange={(e) => update(r._id, { status: e.target.value as any })}>
                    <option value="pending">pending</option>
                    <option value="approved">approved</option>
                    <option value="rejected">rejected</option>
                  </select>
                </td>
                <td>
                  <button onClick={() => remove(r._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  No reviews yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
