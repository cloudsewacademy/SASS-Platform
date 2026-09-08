import { useEffect, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { api } from "../api/client";
import ImageUploadField from "../components/ImageUploadField";

interface Page { _id: string; title: string; slug: string; status: string }
interface NavLink { label: string; type: "page" | "custom"; target: string }
interface FooterColumn { title: string; links: { label: string; url: string }[] }
interface SocialLink { platform: string; url: string }
interface HomepageSection {
  id: string;
  type: "hero" | "featured_products" | "categories_showcase" | "banner" | "testimonials" | "custom_html";
  enabled: boolean;
  config: Record<string, any>;
}

const SECTION_LABELS: Record<HomepageSection["type"], string> = {
  hero: "Hero banner",
  featured_products: "Featured products",
  categories_showcase: "Category tiles",
  banner: "Promo banner",
  testimonials: "Testimonials",
  custom_html: "Custom text block",
};

export default function Appearance() {
  const [tab, setTab] = useState<"theme" | "sections" | "navigation" | "footer">("theme");
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<Page[]>([]);
  const [savedTab, setSavedTab] = useState<string | null>(null);

  const [appearance, setAppearance] = useState({
    primaryColor: "#7c3aed",
    logoUrl: "",
    heroTitle: "",
    heroSubtitle: "",
    heroImageUrl: "",
    productGridStyle: "grid",
  });
  const [header, setHeader] = useState({ announcementText: "", showSearch: true, layout: "standard" });
  const [navLinks, setNavLinks] = useState<NavLink[]>([]);
  const [footerColumns, setFooterColumns] = useState<FooterColumn[]>([]);
  const [copyrightText, setCopyrightText] = useState("");
  const [showPoweredBy, setShowPoweredBy] = useState(true);
  const [footerLayout, setFooterLayout] = useState("columns");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [themePreset, setThemePreset] = useState("violet");
  const [fontFamily, setFontFamily] = useState("system");
  const [borderRadius, setBorderRadius] = useState("rounded");

  useEffect(() => {
    Promise.all([api.get("/settings"), api.get("/pages", { params: { limit: "100" } })]).then(
      ([settingsRes, pagesRes]) => {
        const s = settingsRes.data;
        setAppearance({
          primaryColor: s.appearance?.primaryColor || "#7c3aed",
          logoUrl: s.appearance?.logoUrl || "",
          heroTitle: s.appearance?.heroTitle || "",
          heroSubtitle: s.appearance?.heroSubtitle || "",
          heroImageUrl: s.appearance?.heroImageUrl || "",
          productGridStyle: s.appearance?.productGridStyle || "grid",
        });
        setHeader({
          announcementText: s.header?.announcementText || "",
          showSearch: s.header?.showSearch ?? true,
          layout: s.header?.layout || "standard",
        });
        setNavLinks(s.navigation?.links || []);
        setFooterColumns(s.footer?.columns || []);
        setCopyrightText(s.footer?.copyrightText || "");
        setShowPoweredBy(s.footer?.showPoweredBy ?? true);
        setFooterLayout(s.footer?.layout || "columns");
        setSocialLinks(s.socialLinks || []);
        setSections(s.homepageSections || []);
        setThemePreset(s.appearance?.themePreset || "violet");
        setFontFamily(s.appearance?.fontFamily || "system");
        setBorderRadius(s.appearance?.borderRadius || "rounded");
        setPages(pagesRes.data.items || []);
        setLoading(false);
      }
    );
  }, []);

  function flash(section: string) {
    setSavedTab(section);
    setTimeout(() => setSavedTab(null), 1800);
  }

  async function saveTheme() {
    await api.patch("/settings/appearance", { ...appearance, themePreset, fontFamily, borderRadius });
    await api.patch("/settings/header", header);
    flash("theme");
  }

  const PRESETS: Record<string, string> = {
    violet: "#7c3aed",
    rose: "#e11d48",
    emerald: "#059669",
    amber: "#d97706",
    slate: "#334155",
  };
  function applyPreset(name: string) {
    setThemePreset(name);
    if (PRESETS[name]) setAppearance((a) => ({ ...a, primaryColor: PRESETS[name] }));
  }

  function addSection(type: HomepageSection["type"]) {
    const id = `${type}-${Date.now()}`;
    const defaults: Record<string, any> =
      type === "featured_products"
        ? { title: "Featured products", limit: 8 }
        : type === "categories_showcase"
        ? { title: "Shop by category" }
        : type === "banner"
        ? { title: "", subtitle: "", imageUrl: "", linkUrl: "", linkLabel: "Shop now" }
        : type === "testimonials"
        ? { title: "What customers say", items: [] }
        : type === "custom_html"
        ? { title: "", text: "" }
        : {};
    setSections((s) => [...s, { id, type, enabled: true, config: defaults }]);
  }
  function removeSection(id: string) {
    setSections((s) => s.filter((sec) => sec.id !== id));
  }
  function toggleSection(id: string) {
    setSections((s) => s.map((sec) => (sec.id === id ? { ...sec, enabled: !sec.enabled } : sec)));
  }
  function moveSection(id: string, dir: -1 | 1) {
    setSections((s) => {
      const idx = s.findIndex((sec) => sec.id === id);
      const next = idx + dir;
      if (next < 0 || next >= s.length) return s;
      const copy = [...s];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  }
  function updateSectionConfig(id: string, patch: Record<string, any>) {
    setSections((s) => s.map((sec) => (sec.id === id ? { ...sec, config: { ...sec.config, ...patch } } : sec)));
  }
  async function saveSections() {
    await api.patch("/settings/homepageSections", { homepageSections: sections });
    flash("sections");
  }

  async function saveNavigation() {
    await api.patch("/settings/navigation", { links: navLinks });
    flash("navigation");
  }

  async function saveFooter() {
    await api.patch("/settings/footer", { columns: footerColumns, copyrightText, showPoweredBy, layout: footerLayout });
    await api.patch("/settings/socialLinks", { socialLinks });
    flash("footer");
  }

  function addNavLink() {
    setNavLinks((l) => [...l, { label: "", type: "custom", target: "" }]);
  }
  function updateNavLink(i: number, patch: Partial<NavLink>) {
    setNavLinks((l) => l.map((link, idx) => (idx === i ? { ...link, ...patch } : link)));
  }
  function removeNavLink(i: number) {
    setNavLinks((l) => l.filter((_, idx) => idx !== i));
  }

  function addFooterColumn() {
    setFooterColumns((c) => [...c, { title: "", links: [] }]);
  }
  function updateColumnTitle(i: number, title: string) {
    setFooterColumns((c) => c.map((col, idx) => (idx === i ? { ...col, title } : col)));
  }
  function removeColumn(i: number) {
    setFooterColumns((c) => c.filter((_, idx) => idx !== i));
  }
  function addColumnLink(i: number) {
    setFooterColumns((c) =>
      c.map((col, idx) => (idx === i ? { ...col, links: [...col.links, { label: "", url: "" }] } : col))
    );
  }
  function updateColumnLink(i: number, j: number, patch: Partial<{ label: string; url: string }>) {
    setFooterColumns((c) =>
      c.map((col, idx) =>
        idx === i ? { ...col, links: col.links.map((l, lj) => (lj === j ? { ...l, ...patch } : l)) } : col
      )
    );
  }
  function removeColumnLink(i: number, j: number) {
    setFooterColumns((c) =>
      c.map((col, idx) => (idx === i ? { ...col, links: col.links.filter((_, lj) => lj !== j) } : col))
    );
  }

  function addSocialLink() {
    setSocialLinks((s) => [...s, { platform: "", url: "" }]);
  }
  function updateSocialLink(i: number, patch: Partial<SocialLink>) {
    setSocialLinks((s) => s.map((sl, idx) => (idx === i ? { ...sl, ...patch } : sl)));
  }
  function removeSocialLink(i: number) {
    setSocialLinks((s) => s.filter((_, idx) => idx !== i));
  }

  if (loading) return <div className="page"><p>Loading...</p></div>;

  return (
    <div className="page">
      <div className="page-header"><h1>Appearance</h1></div>

      <div className="tab-row">
        <button className={tab === "theme" ? "tab active" : "tab"} onClick={() => setTab("theme")}>Theme</button>
        <button className={tab === "sections" ? "tab active" : "tab"} onClick={() => setTab("sections")}>Homepage Sections</button>
        <button className={tab === "navigation" ? "tab active" : "tab"} onClick={() => setTab("navigation")}>Navigation</button>
        <button className={tab === "footer" ? "tab active" : "tab"} onClick={() => setTab("footer")}>Footer</button>
      </div>

      {tab === "theme" && (
        <div className="panel">
          <div className="stacked-form" style={{ maxWidth: 480 }}>
            <label>
              Theme preset
              <div className="preset-swatches">
                {Object.entries(PRESETS).map(([name, color]) => (
                  <button
                    type="button"
                    key={name}
                    className={themePreset === name ? "preset-swatch active" : "preset-swatch"}
                    style={{ background: color }}
                    onClick={() => applyPreset(name)}
                    title={name}
                  />
                ))}
              </div>
            </label>
            <label>
              Font family
              <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                <option value="system">System default</option>
                <option value="serif">Serif (elegant)</option>
                <option value="mono">Monospace (technical)</option>
                <option value="rounded">Rounded (friendly)</option>
              </select>
            </label>
            <label>
              Corner style
              <select value={borderRadius} onChange={(e) => setBorderRadius(e.target.value)}>
                <option value="sharp">Sharp corners</option>
                <option value="rounded">Rounded corners</option>
                <option value="pill">Pill / very rounded</option>
              </select>
            </label>
            <label>
              Primary color
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="color"
                  value={appearance.primaryColor}
                  onChange={(e) => setAppearance((a) => ({ ...a, primaryColor: e.target.value }))}
                  style={{ width: 48, height: 34, padding: 2 }}
                />
                <input
                  value={appearance.primaryColor}
                  onChange={(e) => setAppearance((a) => ({ ...a, primaryColor: e.target.value }))}
                />
              </div>
            </label>
            <label>
              Logo URL
              <input
                placeholder="https://... (upload via Media, paste the URL here)"
                value={appearance.logoUrl}
                onChange={(e) => setAppearance((a) => ({ ...a, logoUrl: e.target.value }))}
              />
            </label>
            <label>
              Homepage hero title
              <input
                placeholder="e.g. Fresh flowers, delivered same day"
                value={appearance.heroTitle}
                onChange={(e) => setAppearance((a) => ({ ...a, heroTitle: e.target.value }))}
              />
            </label>
            <label>
              Homepage hero subtitle
              <input
                value={appearance.heroSubtitle}
                onChange={(e) => setAppearance((a) => ({ ...a, heroSubtitle: e.target.value }))}
              />
            </label>
            <label>
              Hero image URL
              <input
                placeholder="https://..."
                value={appearance.heroImageUrl}
                onChange={(e) => setAppearance((a) => ({ ...a, heroImageUrl: e.target.value }))}
              />
            </label>
            <label>
              Header layout
              <select value={header.layout} onChange={(e) => setHeader((h) => ({ ...h, layout: e.target.value }))}>
                <option value="standard">Standard (logo left, nav + search right)</option>
                <option value="centered">Centered (logo centered, nav below)</option>
              </select>
            </label>
            <label>
              Product grid style
              <select
                value={appearance.productGridStyle}
                onChange={(e) => setAppearance((a) => ({ ...a, productGridStyle: e.target.value }))}
              >
                <option value="grid">Grid (image-forward cards)</option>
                <option value="list">List (compact rows)</option>
              </select>
            </label>
            <label>
              Announcement bar text
              <input
                placeholder="e.g. Free delivery on orders over NPR 2000"
                value={header.announcementText}
                onChange={(e) => setHeader((h) => ({ ...h, announcementText: e.target.value }))}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={header.showSearch}
                onChange={(e) => setHeader((h) => ({ ...h, showSearch: e.target.checked }))}
              />
              Show search bar on storefront
            </label>
            <button className="primary-btn" onClick={saveTheme}>
              {savedTab === "theme" ? "Saved!" : "Save theme"}
            </button>
          </div>
        </div>
      )}

      {tab === "sections" && (
        <div>
          <p className="muted" style={{ marginBottom: 14 }}>
            Build your homepage from sections — add, reorder, enable/disable, or remove. Order here is the
            order they render on your storefront.
          </p>

          <div className="add-section-row">
            {(Object.keys(SECTION_LABELS) as HomepageSection["type"][]).map((type) => (
              <button key={type} className="add-row-btn" onClick={() => addSection(type)}>
                + {SECTION_LABELS[type]}
              </button>
            ))}
          </div>

          {sections.length === 0 && (
            <div className="empty-state" style={{ marginTop: 14 }}>
              <p>No sections yet — add one above to start building your homepage.</p>
            </div>
          )}

          {sections.map((sec, i) => (
            <div key={sec.id} className={`section-card ${sec.enabled ? "" : "section-disabled"}`}>
              <div className="section-card-header">
                <div className="section-card-title">
                  <strong>{SECTION_LABELS[sec.type]}</strong>
                  {!sec.enabled && <span className="muted"> (hidden)</span>}
                </div>
                <div className="section-card-actions">
                  <button onClick={() => moveSection(sec.id, -1)} disabled={i === 0}>↑</button>
                  <button onClick={() => moveSection(sec.id, 1)} disabled={i === sections.length - 1}>↓</button>
                  <button onClick={() => toggleSection(sec.id)}>{sec.enabled ? "Hide" : "Show"}</button>
                  <button onClick={() => removeSection(sec.id)} className="icon-btn"><Trash2 size={14} /></button>
                </div>
              </div>

              {sec.type === "hero" && (
                <p className="muted" style={{ margin: 0 }}>
                  Content is set under Theme → Homepage hero title/subtitle/image.
                </p>
              )}

              {sec.type === "featured_products" && (
                <div className="inline-form-fields">
                  <input
                    placeholder="Section title"
                    value={sec.config.title || ""}
                    onChange={(e) => updateSectionConfig(sec.id, { title: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="How many products"
                    value={sec.config.limit || 8}
                    onChange={(e) => updateSectionConfig(sec.id, { limit: Number(e.target.value) })}
                    style={{ maxWidth: 120 }}
                  />
                </div>
              )}

              {sec.type === "categories_showcase" && (
                <input
                  placeholder="Section title"
                  value={sec.config.title || ""}
                  onChange={(e) => updateSectionConfig(sec.id, { title: e.target.value })}
                />
              )}

              {sec.type === "banner" && (
                <div className="stacked-form" style={{ maxWidth: 480 }}>
                  <input
                    placeholder="Title"
                    value={sec.config.title || ""}
                    onChange={(e) => updateSectionConfig(sec.id, { title: e.target.value })}
                  />
                  <input
                    placeholder="Subtitle"
                    value={sec.config.subtitle || ""}
                    onChange={(e) => updateSectionConfig(sec.id, { subtitle: e.target.value })}
                  />
                  <ImageUploadField value={sec.config.imageUrl || ""} onChange={(url) => updateSectionConfig(sec.id, { imageUrl: url })} label="Banner image" />
                  <div className="inline-form-fields">
                    <input
                      placeholder="Link URL (e.g. /category-slug)"
                      value={sec.config.linkUrl || ""}
                      onChange={(e) => updateSectionConfig(sec.id, { linkUrl: e.target.value })}
                    />
                    <input
                      placeholder="Button label"
                      value={sec.config.linkLabel || ""}
                      onChange={(e) => updateSectionConfig(sec.id, { linkLabel: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {sec.type === "testimonials" && (
                <TestimonialsEditor
                  title={sec.config.title || ""}
                  items={sec.config.items || []}
                  onChange={(patch) => updateSectionConfig(sec.id, patch)}
                />
              )}

              {sec.type === "custom_html" && (
                <div className="stacked-form" style={{ maxWidth: 600 }}>
                  <input
                    placeholder="Title (optional)"
                    value={sec.config.title || ""}
                    onChange={(e) => updateSectionConfig(sec.id, { title: e.target.value })}
                  />
                  <textarea
                    rows={3}
                    placeholder="Text content"
                    value={sec.config.text || ""}
                    onChange={(e) => updateSectionConfig(sec.id, { text: e.target.value })}
                  />
                </div>
              )}
            </div>
          ))}

          <button className="primary-btn" onClick={saveSections} style={{ marginTop: 12 }}>
            {savedTab === "sections" ? "Saved!" : "Save homepage sections"}
          </button>
        </div>
      )}

      {tab === "navigation" && (
        <div className="panel">
          <p className="muted" style={{ marginTop: 0 }}>
            Build your storefront's nav menu. Link to a published page or a custom URL, in whatever order
            you want.
          </p>
          {navLinks.map((link, i) => (
            <div key={i} className="builder-row">
              <input
                placeholder="Label (e.g. About)"
                value={link.label}
                onChange={(e) => updateNavLink(i, { label: e.target.value })}
              />
              <select value={link.type} onChange={(e) => updateNavLink(i, { type: e.target.value as any, target: "" })}>
                <option value="page">Page</option>
                <option value="custom">Custom URL</option>
              </select>
              {link.type === "page" ? (
                <select value={link.target} onChange={(e) => updateNavLink(i, { target: e.target.value })}>
                  <option value="">Select page...</option>
                  {pages.map((p) => (
                    <option key={p._id} value={p.slug}>
                      {p.title}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  placeholder="https://..."
                  value={link.target}
                  onChange={(e) => updateNavLink(i, { target: e.target.value })}
                />
              )}
              <button onClick={() => removeNavLink(i)} className="icon-btn"><Trash2 size={15} /></button>
            </div>
          ))}
          <button className="add-row-btn" onClick={addNavLink}><Plus size={14} /> Add link</button>
          <div style={{ marginTop: 16 }}>
            <button className="primary-btn" onClick={saveNavigation}>
              {savedTab === "navigation" ? "Saved!" : "Save navigation"}
            </button>
          </div>
        </div>
      )}

      {tab === "footer" && (
        <>
          <div className="panel" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Footer columns</h3>
            {footerColumns.map((col, i) => (
              <div key={i} className="footer-col-editor">
                <div className="builder-row">
                  <input
                    placeholder="Column title (e.g. Support)"
                    value={col.title}
                    onChange={(e) => updateColumnTitle(i, e.target.value)}
                  />
                  <button onClick={() => removeColumn(i)} className="icon-btn"><Trash2 size={15} /></button>
                </div>
                {col.links.map((l, j) => (
                  <div key={j} className="builder-row" style={{ marginLeft: 16 }}>
                    <input
                      placeholder="Label"
                      value={l.label}
                      onChange={(e) => updateColumnLink(i, j, { label: e.target.value })}
                    />
                    <input
                      placeholder="URL"
                      value={l.url}
                      onChange={(e) => updateColumnLink(i, j, { url: e.target.value })}
                    />
                    <button onClick={() => removeColumnLink(i, j)} className="icon-btn"><Trash2 size={15} /></button>
                  </div>
                ))}
                <button className="add-row-btn" style={{ marginLeft: 16 }} onClick={() => addColumnLink(i)}>
                  <Plus size={14} /> Add link
                </button>
              </div>
            ))}
            <button className="add-row-btn" onClick={addFooterColumn}><Plus size={14} /> Add column</button>
          </div>

          <div className="panel" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Social links</h3>
            {socialLinks.map((s, i) => (
              <div key={i} className="builder-row">
                <input
                  placeholder="Platform (e.g. Instagram)"
                  value={s.platform}
                  onChange={(e) => updateSocialLink(i, { platform: e.target.value })}
                />
                <input placeholder="URL" value={s.url} onChange={(e) => updateSocialLink(i, { url: e.target.value })} />
                <button onClick={() => removeSocialLink(i)} className="icon-btn"><Trash2 size={15} /></button>
              </div>
            ))}
            <button className="add-row-btn" onClick={addSocialLink}><Plus size={14} /> Add social link</button>
          </div>

          <div className="panel">
            <label>
              Footer layout
              <select value={footerLayout} onChange={(e) => setFooterLayout(e.target.value)}>
                <option value="columns">Columns (multi-column link groups)</option>
                <option value="simple">Simple (single centered row)</option>
              </select>
            </label>
            <label style={{ marginTop: 12 }}>
              Copyright text
              <input
                placeholder="e.g. © 2026 Your Store. All rights reserved."
                value={copyrightText}
                onChange={(e) => setCopyrightText(e.target.value)}
                style={{ width: "100%", marginTop: 6 }}
              />
            </label>
            <label className="checkbox-label" style={{ marginTop: 10 }}>
              <input type="checkbox" checked={showPoweredBy} onChange={(e) => setShowPoweredBy(e.target.checked)} />
              Show "Powered by SaaS Platform" in footer
            </label>
            <div style={{ marginTop: 14 }}>
              <button className="primary-btn" onClick={saveFooter}>
                {savedTab === "footer" ? "Saved!" : "Save footer"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface TestimonialItem {
  name: string;
  quote: string;
}

function TestimonialsEditor({
  title,
  items,
  onChange,
}: {
  title: string;
  items: TestimonialItem[];
  onChange: (patch: { title?: string; items?: TestimonialItem[] }) => void;
}) {
  function addItem() {
    onChange({ items: [...items, { name: "", quote: "" }] });
  }
  function updateItem(i: number, patch: Partial<TestimonialItem>) {
    onChange({ items: items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });
  }
  function removeItem(i: number) {
    onChange({ items: items.filter((_, idx) => idx !== i) });
  }

  return (
    <div>
      <input placeholder="Section title" value={title} onChange={(e) => onChange({ title: e.target.value })} style={{ marginBottom: 10 }} />
      {items.map((it, i) => (
        <div key={i} className="builder-row">
          <input placeholder="Customer name" value={it.name} onChange={(e) => updateItem(i, { name: e.target.value })} />
          <input placeholder="Quote" value={it.quote} onChange={(e) => updateItem(i, { quote: e.target.value })} style={{ flex: 2 }} />
          <button onClick={() => removeItem(i)} className="icon-btn"><Trash2 size={15} /></button>
        </div>
      ))}
      <button className="add-row-btn" onClick={addItem}><Plus size={14} /> Add testimonial</button>
    </div>
  );
}
