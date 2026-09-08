import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { api } from "../api/client";
import { useCrud } from "../api/useCrud";
import ImageUploadField from "../components/ImageUploadField";

interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  status: string;
  category?: string;
  categoryIds?: string[];
  brandId?: string;
  images?: string[];
  badges?: { trending?: boolean; bestSeller?: boolean };
}
interface Category { _id: string; name: string }
interface Brand { _id: string; name: string }

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

const emptyForm = {
  name: "",
  sku: "",
  price: "",
  compareAtPrice: "",
  costPrice: "",
  weight: "",
  stock: "",
  brandId: "",
  status: "draft",
  description: "",
  metaTitle: "",
  metaDescription: "",
  keywords: "",
  trending: false,
  bestSeller: false,
};

export default function Products() {
  const { items, loading, create, remove } = useCrud<Product>("products", {});
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [image, setImage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/categories", { params: { limit: "100" } }).then(({ data }) => setCategories(data.items));
    api.get("/brands", { params: { limit: "100" } }).then(({ data }) => setBrands(data.items));
  }, []);

  function update(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleCategory(id: string) {
    setSelectedCategoryIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await create({
        name: form.name,
        sku: form.sku,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        costPrice: form.costPrice ? Number(form.costPrice) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        stock: Number(form.stock) || 0,
        categoryIds: selectedCategoryIds.length ? selectedCategoryIds : undefined,
        categoryId: selectedCategoryIds[0] || undefined,
        brandId: form.brandId || undefined,
        status: form.status,
        description: form.description || undefined,
        images: image ? [image] : [],
        seo: {
          metaTitle: form.metaTitle || undefined,
          metaDescription: form.metaDescription || undefined,
          keywords: form.keywords || undefined,
        },
        badges: { trending: form.trending, bestSeller: form.bestSeller },
      } as Partial<Product>);
      setForm(emptyForm);
      setSelectedCategoryIds([]);
      setImage("");
      setShowForm(false);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  }

  const categoryNames = (ids?: string[]) =>
    (ids || []).map((id) => categories.find((c) => c._id === id)?.name).filter(Boolean).join(", ");
  const brandName = (id?: string) => brands.find((b) => b._id === id)?.name;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Products</h1>
        <button className="primary-btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ Add Product"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="inline-form product-form">
          {error && <p className="error">{error}</p>}

          <div className="inline-form-fields">
            <label style={{ maxWidth: 140 }}>
              Product image
              <ImageUploadField value={image} onChange={setImage} label="" />
            </label>
            <label>
              Name
              <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
            </label>
            <label>
              SKU
              <input value={form.sku} onChange={(e) => update("sku", e.target.value)} required />
            </label>
            <label>
              Brand
              <select value={form.brandId} onChange={(e) => update("brandId", e.target.value)}>
                <option value="">None</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => update("status", e.target.value)}>
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </label>
          </div>

          <label>
            Categories
            <div className="chip-select">
              {categories.length === 0 && <span className="muted">Add a category first to tag products.</span>}
              {categories.map((c) => (
                <button
                  type="button"
                  key={c._id}
                  className={selectedCategoryIds.includes(c._id) ? "chip active" : "chip"}
                  onClick={() => toggleCategory(c._id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </label>

          <h3 className="form-section-title">Pricing & Discount</h3>
          <div className="inline-form-fields">
            <label>
              Selling price (NPR)
              <input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} required />
            </label>
            <label>
              Original price (optional, for strikethrough)
              <input type="number" value={form.compareAtPrice} onChange={(e) => update("compareAtPrice", e.target.value)} />
            </label>
            <label>
              Cost price (internal)
              <input type="number" value={form.costPrice} onChange={(e) => update("costPrice", e.target.value)} />
            </label>
            <label>
              Weight (kg)
              <input type="number" value={form.weight} onChange={(e) => update("weight", e.target.value)} />
            </label>
            <label>
              Stock qty
              <input type="number" value={form.stock} onChange={(e) => update("stock", e.target.value)} />
            </label>
          </div>

          <label>
            Description
            <textarea rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} />
          </label>

          <h3 className="form-section-title">SEO Metadata</h3>
          <div className="inline-form-fields">
            <label>
              Meta title
              <input value={form.metaTitle} onChange={(e) => update("metaTitle", e.target.value)} maxLength={60} />
            </label>
            <label>
              Keywords
              <input value={form.keywords} onChange={(e) => update("keywords", e.target.value)} placeholder="comma, separated" />
            </label>
          </div>
          <label>
            Meta description
            <input value={form.metaDescription} onChange={(e) => update("metaDescription", e.target.value)} maxLength={160} />
          </label>

          <div className="inline-form-fields">
            <label className="checkbox-label">
              <input type="checkbox" checked={form.trending} onChange={(e) => update("trending", e.target.checked)} />
              Trending badge
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={form.bestSeller} onChange={(e) => update("bestSeller", e.target.checked)} />
              Best seller badge
            </label>
          </div>

          <button className="primary-btn" type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save product"}
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Categories</th>
              <th>Brand</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((p) => (
              <tr key={p._id}>
                <td>
                  {p.images?.[0] ? (
                    <img src={p.images[0].startsWith("http") ? p.images[0] : `${API_ORIGIN}${p.images[0]}`} alt="" className="table-thumb" />
                  ) : (
                    <div className="table-thumb table-thumb-placeholder" />
                  )}
                </td>
                <td>
                  {p.name}
                  {p.badges?.trending && <span className="badge" style={{ marginLeft: 6 }}>trending</span>}
                  {p.badges?.bestSeller && <span className="badge" style={{ marginLeft: 6 }}>best seller</span>}
                </td>
                <td>{p.sku}</td>
                <td>NPR {p.price?.toLocaleString()}</td>
                <td>{p.stock}</td>
                <td>{categoryNames(p.categoryIds) || <span className="muted">—</span>}</td>
                <td>{brandName(p.brandId) || <span className="muted">—</span>}</td>
                <td>{p.status}</td>
                <td>
                  <button onClick={() => remove(p._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {(items ?? []).length === 0 && (
              <tr>
                <td colSpan={9} className="muted">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
