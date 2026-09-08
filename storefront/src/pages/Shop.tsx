import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useStoreSlug } from "../context/ResolvedSlugContext";
import { api } from "../api/client";
import StoreLayout from "../components/StoreLayout";
import ProductGrid from "../components/ProductGrid";
import type { GridProduct } from "../components/ProductGrid";

interface Category {
  _id: string;
  name: string;
}

export default function Shop() {
  const slug = useStoreSlug();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<GridProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.get(`/public/stores/${slug}/categories`).then(({ data }) => setCategories(data.categories));
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .get(`/public/stores/${slug}/products`, {
        params: { search: search || undefined, categoryId: categoryId || undefined, limit: 60 },
      })
      .then(({ data }) => setProducts(data.products))
      .finally(() => setLoading(false));
  }, [slug, search, categoryId]);

  function updateSearch(q: string) {
    setSearch(q);
    setSearchParams((p) => {
      if (q) p.set("q", q);
      else p.delete("q");
      return p;
    });
  }

  return (
    <StoreLayout onSearch={updateSearch}>
      {(store) => (
        <div>
          <h1 style={{ marginBottom: 16 }}>Shop</h1>
          {categories.length > 0 && (
            <div className="shop-filter-row">
              <button className={!categoryId ? "chip active" : "chip"} onClick={() => setCategoryId("")}>
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c._id}
                  className={categoryId === c._id ? "chip active" : "chip"}
                  onClick={() => setCategoryId(c._id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
          {loading ? (
            <p>Loading products...</p>
          ) : (
            <ProductGrid products={products} listView={store.appearance?.productGridStyle === "list"} />
          )}
        </div>
      )}
    </StoreLayout>
  );
}
