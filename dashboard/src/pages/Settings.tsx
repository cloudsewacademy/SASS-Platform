import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../api/client";

interface Payments {
  codEnabled: boolean;
  esewaEnabled: boolean;
  esewaMerchantCode: string;
  khaltiEnabled: boolean;
  khaltiPublicKey: string;
  khaltiSecretKey: string;
  fonepayEnabled: boolean;
  fonepayMerchantCode: string;
  fonepaySecretKey: string;
  codMaxAmount: string;
}

const emptyPayments: Payments = {
  codEnabled: true,
  esewaEnabled: false,
  esewaMerchantCode: "",
  khaltiEnabled: false,
  khaltiPublicKey: "",
  khaltiSecretKey: "",
  fonepayEnabled: false,
  fonepayMerchantCode: "",
  fonepaySecretKey: "",
  codMaxAmount: "",
};

export default function Settings() {
  const [tab, setTab] = useState<"store" | "domain" | "payments">("store");
  const [storeDetails, setStoreDetails] = useState({ name: "", address: "", phone: "", email: "" });
  const [domainSlug, setDomainSlug] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [domainInput, setDomainInput] = useState("");
  const [domainError, setDomainError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payments>(emptyPayments);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/settings").then(({ data }) => {
      setStoreDetails(data.storeDetails);
      setPayments({
        codEnabled: data.payments.codEnabled ?? true,
        esewaEnabled: data.payments.esewaEnabled ?? false,
        esewaMerchantCode: data.payments.esewaMerchantCode || "",
        khaltiEnabled: data.payments.khaltiEnabled ?? false,
        khaltiPublicKey: data.payments.khaltiPublicKey || "",
        khaltiSecretKey: data.payments.khaltiSecretKey || "",
        fonepayEnabled: data.payments.fonepayEnabled ?? false,
        fonepayMerchantCode: data.payments.fonepayMerchantCode || "",
        fonepaySecretKey: data.payments.fonepaySecretKey || "",
        codMaxAmount: data.payments.codMaxAmount ? String(data.payments.codMaxAmount) : "",
      });
      setLoading(false);
    });
    api.get("/settings/domain").then(({ data }) => {
      setDomainSlug(data.slug);
      setCustomDomain(data.customDomain || "");
      setDomainInput(data.customDomain || "");
    });
  }, []);

  async function saveDomain() {
    setDomainError(null);
    try {
      const { data } = await api.patch("/settings/domain", { customDomain: domainInput });
      setCustomDomain(data.customDomain || "");
      flash("domain");
    } catch (err: any) {
      setDomainError(err.response?.data?.error || "Failed to save domain");
    }
  }

  function flash(tabName: string) {
    setSaved(tabName);
    setTimeout(() => setSaved(null), 1800);
  }

  async function saveStoreDetails(e: FormEvent) {
    e.preventDefault();
    await api.patch("/settings/storeDetails", storeDetails);
    flash("store");
  }

  async function savePayments(e: FormEvent) {
    e.preventDefault();
    await api.patch("/settings/payments", {
      ...payments,
      codMaxAmount: payments.codMaxAmount ? Number(payments.codMaxAmount) : undefined,
    });
    flash("payments");
  }

  function updatePayments(patch: Partial<Payments>) {
    setPayments((p) => ({ ...p, ...patch }));
  }

  if (loading) return <div className="page"><p>Loading...</p></div>;

  return (
    <div className="page">
      <div className="page-header"><h1>Settings</h1></div>

      <div className="tab-row">
        <button className={tab === "store" ? "tab active" : "tab"} onClick={() => setTab("store")}>Store details</button>
        <button className={tab === "domain" ? "tab active" : "tab"} onClick={() => setTab("domain")}>Domain</button>
        <button className={tab === "payments" ? "tab active" : "tab"} onClick={() => setTab("payments")}>Payments</button>
      </div>

      {tab === "store" && (
        <div className="panel">
          <form onSubmit={saveStoreDetails} className="stacked-form">
            <label>
              Store name
              <input value={storeDetails.name} onChange={(e) => setStoreDetails((s) => ({ ...s, name: e.target.value }))} />
            </label>
            <label>
              Address
              <input value={storeDetails.address} onChange={(e) => setStoreDetails((s) => ({ ...s, address: e.target.value }))} />
            </label>
            <label>
              Phone
              <input value={storeDetails.phone} onChange={(e) => setStoreDetails((s) => ({ ...s, phone: e.target.value }))} />
            </label>
            <label>
              Support email
              <input value={storeDetails.email} onChange={(e) => setStoreDetails((s) => ({ ...s, email: e.target.value }))} />
            </label>
            <button className="primary-btn" type="submit">{saved === "store" ? "Saved!" : "Save"}</button>
          </form>
        </div>
      )}

      {tab === "domain" && (
        <div className="panel">
          <p className="muted" style={{ marginTop: 0 }}>
            Your store's built-in URL is <code>{window.location.origin}/{domainSlug}</code>. You can also point
            your own domain at this store — customers will see your domain directly, no store path needed.
          </p>

          <div className="stacked-form" style={{ maxWidth: 420 }}>
            <label>
              Your domain
              <input
                placeholder="e.g. anishstore.com"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
              />
            </label>
            {domainError && <p className="error">{domainError}</p>}
            <button className="primary-btn" onClick={saveDomain}>
              {saved === "domain" ? "Saved!" : "Save domain"}
            </button>
          </div>

          {customDomain && (
            <div className="empty-state" style={{ marginTop: 20, textAlign: "left" }}>
              <p style={{ margin: "0 0 8px" }}>
                <strong>DNS setup needed</strong> — this only takes effect once your domain's DNS points here:
              </p>
              <p className="muted" style={{ margin: 0 }}>
                Add a CNAME (or A record, depending on your DNS provider) for <strong>{customDomain}</strong>{" "}
                pointing at this platform's hosting address. Ask whoever deployed this platform for the exact
                value to use — it depends on where the storefront app is hosted.
              </p>
            </div>
          )}
        </div>
      )}

      {tab === "payments" && (
        <form onSubmit={savePayments}>
          <p className="muted" style={{ marginBottom: 14 }}>
            Everything here is configured once and applies to your storefront checkout automatically —
            credentials are stored server-side and are never exposed to the public storefront API.
          </p>

          <div className="panel gateway-panel">
            <div className="row-between">
              <h3 style={{ margin: 0 }}>Cash on Delivery</h3>
              <label className="checkbox-label">
                <input type="checkbox" checked={payments.codEnabled} onChange={(e) => updatePayments({ codEnabled: e.target.checked })} />
                Enabled
              </label>
            </div>
            <label style={{ marginTop: 10, maxWidth: 260 }}>
              Max order amount for COD (optional)
              <input
                type="number"
                placeholder="No limit"
                value={payments.codMaxAmount}
                onChange={(e) => updatePayments({ codMaxAmount: e.target.value })}
              />
            </label>
          </div>

          <div className="panel gateway-panel">
            <div className="row-between">
              <h3 style={{ margin: 0 }}>eSewa</h3>
              <label className="checkbox-label">
                <input type="checkbox" checked={payments.esewaEnabled} onChange={(e) => updatePayments({ esewaEnabled: e.target.checked })} />
                Enabled
              </label>
            </div>
            {payments.esewaEnabled && (
              <label style={{ marginTop: 10, maxWidth: 320 }}>
                Merchant code
                <input value={payments.esewaMerchantCode} onChange={(e) => updatePayments({ esewaMerchantCode: e.target.value })} />
              </label>
            )}
          </div>

          <div className="panel gateway-panel">
            <div className="row-between">
              <h3 style={{ margin: 0 }}>Khalti</h3>
              <label className="checkbox-label">
                <input type="checkbox" checked={payments.khaltiEnabled} onChange={(e) => updatePayments({ khaltiEnabled: e.target.checked })} />
                Enabled
              </label>
            </div>
            {payments.khaltiEnabled && (
              <div className="inline-form-fields" style={{ marginTop: 10 }}>
                <label>
                  Public key
                  <input value={payments.khaltiPublicKey} onChange={(e) => updatePayments({ khaltiPublicKey: e.target.value })} />
                </label>
                <label>
                  Secret key
                  <input
                    type="password"
                    value={payments.khaltiSecretKey}
                    onChange={(e) => updatePayments({ khaltiSecretKey: e.target.value })}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="panel gateway-panel">
            <div className="row-between">
              <h3 style={{ margin: 0 }}>Fonepay</h3>
              <label className="checkbox-label">
                <input type="checkbox" checked={payments.fonepayEnabled} onChange={(e) => updatePayments({ fonepayEnabled: e.target.checked })} />
                Enabled
              </label>
            </div>
            {payments.fonepayEnabled && (
              <div className="inline-form-fields" style={{ marginTop: 10 }}>
                <label>
                  Merchant code
                  <input value={payments.fonepayMerchantCode} onChange={(e) => updatePayments({ fonepayMerchantCode: e.target.value })} />
                </label>
                <label>
                  Secret key
                  <input
                    type="password"
                    value={payments.fonepaySecretKey}
                    onChange={(e) => updatePayments({ fonepaySecretKey: e.target.value })}
                  />
                </label>
              </div>
            )}
          </div>

          <button className="primary-btn" type="submit">{saved === "payments" ? "Saved!" : "Save payment settings"}</button>
        </form>
      )}
    </div>
  );
}
