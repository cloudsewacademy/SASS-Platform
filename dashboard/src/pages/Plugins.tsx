import { useEffect, useState } from "react";
import { api } from "../api/client";

const AVAILABLE_PLUGINS = [
  { key: "abandonedCartRecovery", label: "Abandoned Cart Recovery" },
  { key: "loyaltyPoints", label: "Loyalty Points" },
  { key: "liveChat", label: "Live Chat Widget" },
  { key: "advancedSeo", label: "Advanced SEO Toolkit" },
];

export default function Plugins() {
  const [plugins, setPlugins] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/settings").then(({ data }) => {
      setPlugins(data.plugins || {});
      setLoading(false);
    });
  }, []);

  async function toggle(key: string) {
    const next = { ...plugins, [key]: !plugins[key] };
    setPlugins(next);
    await api.patch("/settings/plugins", next);
  }

  if (loading) return <div className="page"><p>Loading...</p></div>;

  return (
    <div className="page">
      <div className="page-header"><h1>Plugins</h1></div>
      <div className="panel">
        {AVAILABLE_PLUGINS.map((p) => (
          <div key={p.key} className="row-between" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
            <span>{p.label}</span>
            <label className="checkbox-label">
              <input type="checkbox" checked={!!plugins[p.key]} onChange={() => toggle(p.key)} />
              {plugins[p.key] ? "Enabled" : "Disabled"}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
