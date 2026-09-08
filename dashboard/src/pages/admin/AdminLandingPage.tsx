import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminClient";

interface LandingContent {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  ctaText: string;
}

export default function AdminLandingPage() {
  const [content, setContent] = useState<LandingContent | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get("/admin/platform-settings").then(({ data }) => {
      setContent(data.landingPage);
      setLoading(false);
    });
  }, []);

  async function save() {
    if (!content) return;
    await adminApi.patch("/admin/platform-settings", content);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function update(field: keyof LandingContent, value: string) {
    setContent((c) => (c ? { ...c, [field]: value } : c));
  }

  if (loading || !content) return <div className="page"><p>Loading...</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Landing Page</h1>
      </div>
      <p className="muted" style={{ marginBottom: 16 }}>
        Edits the platform's own marketing homepage (what visitors see at the root domain before logging
        in) — not any store's storefront.
      </p>

      <div className="panel">
        <div className="stacked-form" style={{ maxWidth: 560 }}>
          <label>
            Eyebrow badge text
            <input value={content.heroEyebrow} onChange={(e) => update("heroEyebrow", e.target.value)} />
          </label>
          <label>
            Hero title
            <input value={content.heroTitle} onChange={(e) => update("heroTitle", e.target.value)} />
          </label>
          <label>
            Hero subtitle
            <textarea
              rows={3}
              value={content.heroSubtitle}
              onChange={(e) => update("heroSubtitle", e.target.value)}
            />
          </label>
          <label>
            CTA button text
            <input value={content.ctaText} onChange={(e) => update("ctaText", e.target.value)} />
          </label>
          <button className="primary-btn" onClick={save}>
            {saved ? "Saved!" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
