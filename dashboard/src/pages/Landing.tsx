import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag, Boxes, Users, LineChart, ShieldCheck,
  ArrowRight, Zap, Layers, Palette, CreditCard, Globe,
} from "lucide-react";
import { api } from "../api/client";

const features = [
  { icon: ShoppingBag, title: "Orders & Inventory", desc: "Track every order and stock level in real time, with automatic low-stock alerts and atomic stock-safe checkout." },
  { icon: Users, title: "Customers & Leads", desc: "Every order builds your customer list automatically. Manage leads before they convert, no manual entry." },
  { icon: LineChart, title: "Analytics & Finance", desc: "Revenue trends, top products, and COD reconciliation — no spreadsheets, no third-party tools." },
  { icon: Globe, title: "Your own storefront", desc: "Every store gets a live public website the moment you publish your first product — fully custom homepage." },
  { icon: Palette, title: "Full theme control", desc: "Header, footer, navigation, homepage sections, fonts, colors — build your storefront layout from the dashboard." },
  { icon: CreditCard, title: "Payments, your way", desc: "COD, eSewa, Khalti, Fonepay — enable exactly what you accept, configured once from Settings." },
  { icon: Boxes, title: "Categories, Brands, Coupons", desc: "Organize your catalog and run promotions without touching code." },
  { icon: ShieldCheck, title: "Your data, isolated", desc: "Every store runs on its own separate database — no shared tables, no cross-store risk." },
];

const stats = [
  { value: "100%", label: "Data isolation per store" },
  { value: "0", label: "Code required to launch" },
  { value: "24/7", label: "Storefront uptime" },
];

export default function Landing() {
  const [content, setContent] = useState({
    heroEyebrow: "Multi-tenant commerce platform",
    heroTitle: "Run your online store from one dashboard.",
    heroSubtitle:
      "Orders, inventory, customers, coupons, payments, and your own fully customizable storefront — set up in minutes, isolated on your own database.",
    ctaText: "Create your store — free",
  });

  useEffect(() => {
    api.get("/platform-settings").then(({ data }) => setContent(data)).catch(() => {});
  }, []);

  return (
    <div className="landing">
      <header className="landing-nav">
        <span className="landing-logo">
          <Zap size={18} /> SaaS Platform
        </span>
        <div className="landing-nav-links">
          <Link to="/login">Log in</Link>
          <Link to="/register" className="primary-btn">Create your store</Link>
        </div>
      </header>

      <section className="landing-hero-dark">
        <div className="landing-hero-glow" />
        <span className="landing-eyebrow"><Layers size={13} /> {content.heroEyebrow}</span>
        <h1>{content.heroTitle}</h1>
        <p>{content.heroSubtitle}</p>
        <div className="landing-hero-actions">
          <Link to="/register" className="landing-cta">
            {content.ctaText} <ArrowRight size={16} />
          </Link>
          <Link to="/login" className="landing-secondary-dark">I already have a store</Link>
        </div>

        <div className="landing-stats">
          {stats.map((s) => (
            <div key={s.label} className="landing-stat">
              <span className="landing-stat-value">{s.value}</span>
              <span className="landing-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-features-section">
        <h2 className="landing-section-title">Everything your store needs</h2>
        <p className="landing-section-subtitle">One platform, from first product to first sale to full storefront customization.</p>
        <div className="landing-features">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="landing-feature-card">
              <span className="stat-icon stat-icon-purple"><Icon size={18} /></span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-cta-section">
        <h2>Ready to launch your store?</h2>
        <p>No credit card, no setup calls — create an account and you're live.</p>
        <Link to="/register" className="landing-cta">
          {content.ctaText} <ArrowRight size={16} />
        </Link>
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} SaaS Platform</span>
      </footer>
    </div>
  );
}
