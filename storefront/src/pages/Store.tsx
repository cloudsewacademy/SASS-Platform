import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mediaUrl } from "../api/client";
import StoreLayout from "../components/StoreLayout";
import ProductGrid from "../components/ProductGrid";
import type { GridProduct } from "../components/ProductGrid";
import { useStoreSlug, useStoreBasePath } from "../context/ResolvedSlugContext";

interface Category { _id: string; name: string; slug: string; image?: string }

interface HomepageSection {
  id: string;
  type: "hero" | "featured_products" | "categories_showcase" | "banner" | "testimonials" | "custom_html";
  enabled: boolean;
  config: Record<string, any>;
}

export default function Store() {
  const slug = useStoreSlug();
  const basePath = useStoreBasePath();
  const [productsBySection, setProductsBySection] = useState<Record<string, GridProduct[]>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [loaded, setLoaded] = useState(false);

  return (
    <StoreLayout>
      {(store) => {
        const sections: HomepageSection[] =
          store.homepageSections && store.homepageSections.length > 0
            ? (store.homepageSections as HomepageSection[]).filter((s) => s.enabled)
            : [
                { id: "hero-fallback", type: "hero", enabled: true, config: {} },
                { id: "featured-fallback", type: "featured_products", enabled: true, config: { title: "Our products", limit: 24 } },
              ];

        return (
          <HomeSections
            store={store}
            sections={sections}
            productsBySection={productsBySection}
            setProductsBySection={setProductsBySection}
            categories={categories}
            setCategories={setCategories}
            loaded={loaded}
            setLoaded={setLoaded}
            slug={slug!}
            basePath={basePath}
          />
        );
      }}
    </StoreLayout>
  );
}

function HomeSections({
  store,
  sections,
  productsBySection,
  setProductsBySection,
  categories,
  setCategories,
  loaded,
  setLoaded,
  slug,
  basePath,
}: {
  store: any;
  sections: HomepageSection[];
  productsBySection: Record<string, GridProduct[]>;
  setProductsBySection: (fn: (prev: Record<string, GridProduct[]>) => Record<string, GridProduct[]>) => void;
  categories: Category[];
  setCategories: (c: Category[]) => void;
  loaded: boolean;
  setLoaded: (b: boolean) => void;
  slug: string;
  basePath: string;
}) {
  useEffect(() => {
    const needsCategories = sections.some((s) => s.type === "categories_showcase");
    const featuredSections = sections.filter((s) => s.type === "featured_products");

    const tasks: Promise<void>[] = [];
    if (needsCategories) {
      tasks.push(api.get(`/public/stores/${slug}/categories`).then(({ data }) => setCategories(data.categories)));
    }
    for (const sec of featuredSections) {
      tasks.push(
        api
          .get(`/public/stores/${slug}/products`, { params: { limit: sec.config.limit || 8 } })
          .then(({ data }) => setProductsBySection((prev) => ({ ...prev, [sec.id]: data.products })))
      );
    }
    Promise.all(tasks).finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return (
    <>
      {sections.map((sec) => {
        switch (sec.type) {
          case "hero":
            return (store.appearance?.heroTitle || store.appearance?.heroImageUrl) ? (
              <section
                key={sec.id}
                className="store-hero"
                style={store.appearance.heroImageUrl ? { backgroundImage: `url(${mediaUrl(store.appearance.heroImageUrl)})` } : undefined}
              >
                <div className="store-hero-overlay">
                  {store.appearance.heroTitle && <h1>{store.appearance.heroTitle}</h1>}
                  {store.appearance.heroSubtitle && <p>{store.appearance.heroSubtitle}</p>}
                </div>
              </section>
            ) : null;

          case "featured_products":
            return (
              <section key={sec.id} className="home-section">
                {sec.config.title && <h2 className="home-section-title">{sec.config.title}</h2>}
                {!loaded ? (
                  <p>Loading...</p>
                ) : (
                  <ProductGrid
                    products={productsBySection[sec.id] || []}
                    listView={store.appearance?.productGridStyle === "list"}
                  />
                )}
              </section>
            );

          case "categories_showcase":
            return (
              <section key={sec.id} className="home-section">
                {sec.config.title && <h2 className="home-section-title">{sec.config.title}</h2>}
                <div className="category-tiles">
                  {categories.map((c) => (
                    <Link key={c._id} to={`${basePath}/shop?categoryId=${c._id}`} className="category-tile">
                      {c.image ? <img src={mediaUrl(c.image)} alt={c.name} /> : <div className="product-image-placeholder" />}
                      <span>{c.name}</span>
                    </Link>
                  ))}
                </div>
              </section>
            );

          case "banner":
            return (
              <section
                key={sec.id}
                className="promo-banner"
                style={sec.config.imageUrl ? { backgroundImage: `url(${mediaUrl(sec.config.imageUrl)})` } : undefined}
              >
                <div className="promo-banner-overlay">
                  {sec.config.title && <h2>{sec.config.title}</h2>}
                  {sec.config.subtitle && <p>{sec.config.subtitle}</p>}
                  {sec.config.linkUrl && (
                    <a href={sec.config.linkUrl} className="buy-btn">
                      {sec.config.linkLabel || "Shop now"}
                    </a>
                  )}
                </div>
              </section>
            );

          case "testimonials":
            return (
              <section key={sec.id} className="home-section">
                {sec.config.title && <h2 className="home-section-title">{sec.config.title}</h2>}
                <div className="testimonial-grid">
                  {(sec.config.items || []).map((t: { name: string; quote: string }, i: number) => (
                    <div key={i} className="testimonial-card">
                      <p>"{t.quote}"</p>
                      <span>— {t.name}</span>
                    </div>
                  ))}
                </div>
              </section>
            );

          case "custom_html":
            return (
              <section key={sec.id} className="home-section cms-page">
                {sec.config.title && <h2 className="home-section-title">{sec.config.title}</h2>}
                {(sec.config.text || "").split("\n").map((p: string, i: number) => (p.trim() ? <p key={i}>{p}</p> : null))}
              </section>
            );

          default:
            return null;
        }
      })}
    </>
  );
}
