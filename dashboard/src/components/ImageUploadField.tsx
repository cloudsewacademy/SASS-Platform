import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { api } from "../api/client";

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

/**
 * File picker that uploads directly to the Media library (POST /media)
 * and feeds the resulting URL back to the parent form — this is what
 * lets Products/Categories/Brands attach a real uploaded image instead
 * of requiring someone to paste a URL from somewhere else.
 */
export default function ImageUploadField({ value, onChange, label = "Image" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/media", formData, { headers: { "Content-Type": "multipart/form-data" } });
      onChange(data.url);
    } catch (err: any) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");
  const previewSrc = value ? (value.startsWith("http") ? value : `${API_ORIGIN}${value}`) : null;

  return (
    <div className="image-upload-field">
      {label && <span className="image-upload-label">{label}</span>}
      {previewSrc ? (
        <div className="image-upload-preview">
          <img src={previewSrc} alt="" />
          <button type="button" className="image-upload-remove" onClick={() => onChange("")}>
            <X size={13} />
          </button>
        </div>
      ) : (
        <label className="image-upload-dropzone">
          {uploading ? (
            <span>Uploading...</span>
          ) : (
            <>
              <ImagePlus size={20} />
              <span>Upload image</span>
            </>
          )}
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} disabled={uploading} />
        </label>
      )}
      {error && <span className="error" style={{ display: "block", marginTop: 4 }}>{error}</span>}
    </div>
  );
}
