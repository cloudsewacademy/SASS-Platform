import { useEffect, useState, useRef } from "react";
import { api } from "../api/client";

interface MediaItem { _id: string; url: string; filename: string; size: number; createdAt: string }

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

export default function Media() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const { data } = await api.get("/media");
    setItems(data.items);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.post("/media", formData, { headers: { "Content-Type": "multipart/form-data" } });
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/media/${id}`);
    load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Media</h1>
        <label className="primary-btn upload-btn">
          {uploading ? "Uploading..." : "+ Upload image"}
          <input ref={fileInput} type="file" accept="image/*" onChange={handleUpload} hidden disabled={uploading} />
        </label>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p>No media uploaded yet.</p>
        </div>
      ) : (
        <div className="media-grid">
          {items.map((m) => (
            <div key={m._id} className="media-tile">
              <img src={`${API_ORIGIN}${m.url}`} alt={m.filename} />
              <button onClick={() => handleDelete(m._id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
