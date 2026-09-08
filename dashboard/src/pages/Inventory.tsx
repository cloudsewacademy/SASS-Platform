import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";

interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  status: string;
  variants: { label: string; sku: string; stock: number }[];
}

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get("/inventory/products", {
      params: { lowStockOnly: lowStockOnly || undefined },
    });
    setProducts(data.products);
    setLoading(false);
  }, [lowStockOnly]);

  useEffect(() => {
    load();
  }, [load]);

  async function adjust(id: string, delta: number, variantLabel?: string) {
    await api.patch(`/inventory/products/${id}/stock`, { delta, variantLabel });
    load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Inventory</h1>
        <label className="checkbox-label">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
          Low stock only
        </label>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Adjust</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) =>
              p.variants.length > 0 ? (
                p.variants.map((v) => (
                  <tr key={v.sku} className={v.stock <= p.lowStockThreshold ? "low-stock-row" : ""}>
                    <td>
                      {p.name} <span className="muted">({v.label})</span>
                    </td>
                    <td>{v.sku}</td>
                    <td>NPR {p.price.toLocaleString()}</td>
                    <td>{v.stock}</td>
                    <td>{p.status}</td>
                    <td>
                      <button onClick={() => adjust(p._id, 1, v.label)}>+1</button>
                      <button onClick={() => adjust(p._id, -1, v.label)}>-1</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr key={p._id} className={p.stock <= p.lowStockThreshold ? "low-stock-row" : ""}>
                  <td>{p.name}</td>
                  <td>{p.sku}</td>
                  <td>NPR {p.price.toLocaleString()}</td>
                  <td>{p.stock}</td>
                  <td>{p.status}</td>
                  <td>
                    <button onClick={() => adjust(p._id, 1)}>+1</button>
                    <button onClick={() => adjust(p._id, -1)}>-1</button>
                  </td>
                </tr>
              )
            )}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
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
