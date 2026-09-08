import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Globe } from "lucide-react";
import { api, mediaUrl } from "../api/client";
import { useCart } from "../context/CartContext";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import { useStoreSlug, useStoreBasePath } from "../context/ResolvedSlugContext";
import { socialIcon } from "./SocialIcons";

export interface StoreInfo {
  storeName: string;
  slug: string;
  appearance: {
    primaryColor: string;
    logoUrl?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    heroImageUrl?: string;
    productGridStyle?: "grid" | "list";
  };
  header: { announcementText?: string; showSearch: boolean; layout?: "standard" | "centered" };
  navigation: { links: { label: string; type: "page" | "custom"; target: string }[] };
  footer: {
    columns: { title: string; links: { label: string; url: string }[] }[];
    copyrightText?: string;
    showPoweredBy: boolean;
    layout?: "columns" | "simple";
  };
  homepageSections?: { id: string; type: string; enabled: boolean; config: Record<string, any> }[];
  socialLinks: { platform: string; url: string }[];
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

interface Page {
  title: string;
  slug: string;
  showInNav: boolean;
}

interface Props {
  children: (store: StoreInfo) => ReactNode;
  onSearch?: (q: string) => void;
}

export default function StoreLayout({ children, onSearch }: Props) {
  const slug = useStoreSlug();
  const basePath = useStoreBasePath();
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const { customer, logout } = useCustomerAuth();
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [navPages, setNavPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    Promise.all([api.get(`/public/stores/${slug}`), api.get(`/public/stores/${slug}/pages`)])
      .then(([storeRes, pagesRes]) => {
        setStore(storeRes.data);
        setNavPages(pagesRes.data.pages || []);
      })
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (notFound) {
    return (
      <div className="empty-page">
        <h1>Store not found</h1>
        <p>This store doesn't exist, or isn't currently active.</p>
      </div>
    );
  }

  if (loading || !store) return <div className="empty-page">{loading ? "Loading..." : null}</div>;

  const accent = store.appearance?.primaryColor || "#7c3aed";

  function navHref(link: { type: "page" | "custom"; target: string }) {
    if (link.type === "page") return `${basePath}/page/${link.target}`;
    return link.target;
  }

  // Combine explicit nav links (from Appearance → Navigation) with any
  // published page that has "Show in nav" checked, skipping pages already
  // linked explicitly so a page never appears twice in the menu.
  const explicitTargets = new Set((store.navigation?.links || []).filter((l) => l.type === "page").map((l) => l.target));
  const autoPageLinks = navPages
    .filter((p) => p.showInNav && !explicitTargets.has(p.slug))
    .map((p) => ({ label: p.title, type: "page" as const, target: p.slug }));

  // "Shop" (the full catalog) is always in the nav by default — without
  // it, a store with no configured navigation has no way to browse past
  // whatever's featured on the homepage. Skipped only if the owner has
  // already added their own link pointing at /shop.
  const hasShopLink = (store.navigation?.links || []).some((l) => l.type === "custom" && l.target === "/shop");
  const shopLink = hasShopLink ? [] : [{ label: "Shop", type: "custom" as const, target: `${basePath}/shop` }];

  const allNavLinks = [...shopLink, ...(store.navigation?.links || []), ...autoPageLinks];

  return (
    <div className="store-page" style={{ ["--accent" as any]: accent }}>
      {store.header?.announcementText && <div className="announcement-bar">{store.header.announcementText}</div>}

      <header className={`store-header header-layout-${store.header?.layout || "standard"}`}>
        <div className="store-header-inner">
          <Link to={basePath || "/"} className="store-brand">
            {store.appearance?.logoUrl ? (
              <img src={mediaUrl(store.appearance.logoUrl)} alt={store.storeName} className="store-logo" />
            ) : (
              <span className="store-name">{store.storeName}</span>
            )}
          </Link>

          {allNavLinks.length > 0 && (
            <nav className="store-nav">
              {allNavLinks.map((link, i) => (
                <a key={i} href={navHref(link)}>
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          {store.header?.showSearch !== false && (
            <input
              className="store-search"
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                onSearch?.(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !onSearch) {
                  navigate(`${basePath}/shop?q=${encodeURIComponent(search)}`);
                }
              }}
            />
          )}

          {customer ? (
            <div className="account-menu">
              <Link to={`${basePath}/account`} className="cart-link" title={customer.name}>
                <User size={19} />
              </Link>
              <button className="account-logout" onClick={logout} title="Log out">
                Log out
              </button>
            </div>
          ) : (
            <Link to={`${basePath}/login`} className="cart-link" title="Log in">
              <User size={19} />
            </Link>
          )}

          <Link to={`${basePath}/cart`} className="cart-link">
            <ShoppingCart size={20} />
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </Link>
        </div>
      </header>

      <main className="store-main">{children(store)}</main>

      <footer className={`store-footer footer-layout-${store.footer?.layout || "columns"}`}>
        {store.footer?.layout === "simple" ? (
          <div className="footer-simple-inner">
            <div className="footer-simple-links">
              {(store.footer?.columns || []).flatMap((c) => c.links).map((l, i) => (
                <a key={i} href={l.url}>
                  {l.label}
                </a>
              ))}
              {store.socialLinks?.map((s, i) => {
                const Icon = socialIcon(s.platform) || Globe;
                return (
                  <a key={`s-${i}`} href={s.url} target="_blank" rel="noreferrer" className="social-icon-link" title={s.platform}>
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="store-footer-inner">
            {store.footer?.columns?.map((col, i) => (
              <div key={i} className="footer-col">
                <h4>{col.title}</h4>
                {col.links.map((l, j) => (
                  <a key={j} href={l.url}>
                    {l.label}
                  </a>
                ))}
              </div>
            ))}
            <div className="footer-col">
              <h4>Contact</h4>
              {store.address && <span>{store.address}</span>}
              {store.contactPhone && <span>{store.contactPhone}</span>}
              {store.contactEmail && <span>{store.contactEmail}</span>}
              {store.socialLinks?.length > 0 && (
                <div className="footer-socials">
                  {store.socialLinks.map((s, i) => {
                    const Icon = socialIcon(s.platform) || Globe;
                    return (
                      <a key={i} href={s.url} target="_blank" rel="noreferrer" className="social-icon-link" title={s.platform}>
                        <Icon size={16} />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="footer-bottom">
          <span>{store.footer?.copyrightText || `© ${new Date().getFullYear()} ${store.storeName}`}</span>
          {store.footer?.showPoweredBy !== false && <span className="powered-by">Powered by SaaS Platform</span>}
        </div>
      </footer>
    </div>
  );
}
