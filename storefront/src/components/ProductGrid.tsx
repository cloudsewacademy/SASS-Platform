import { Link } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { mediaUrl } from "../api/client";
import { useStoreBasePath } from "../context/ResolvedSlugContext";

export interface GridProduct {
  _id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  stock: number;
  variants: { label: string; stock: number; price?: number }[];
}

export default function ProductGrid({ products, listView = false }: { products: GridProduct[]; listView?: boolean }) {
  const basePath = useStoreBasePath();
  const { addItem } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  function quickAdd(e: React.MouseEvent, p: GridProduct) {
    e.preventDefault();
    e.stopPropagation();
    if (p.variants?.length > 0) return;
    addItem({ productId: p._id, name: p.name, price: p.price, image: mediaUrl(p.images?.[0]), maxStock: p.stock }, 1);
    setAddedId(p._id);
    setTimeout(() => setAddedId(null), 1200);
  }

  if (products.length === 0) {
    return (
      <div className="empty-state-store">
        <p>No products published yet — check back soon.</p>
      </div>
    );
  }

  return (
    <div className={`product-grid ${listView ? "list-view" : ""}`}>
      {products.map((p) => (
        <Link key={p._id} to={`${basePath}/product/${p._id}`} className="product-card">
          <div className="product-image">
            {p.images?.[0] ? <img src={mediaUrl(p.images[0])} alt={p.name} /> : <div className="product-image-placeholder" />}
          </div>
          <div className="product-info">
            <span className="product-name">{p.name}</span>
            <span className="product-price">
              NPR {p.price.toLocaleString()}
              {p.compareAtPrice && p.compareAtPrice > p.price && (
                <span className="product-compare">NPR {p.compareAtPrice.toLocaleString()}</span>
              )}
            </span>
            {p.stock <= 0 ? (
              <span className="out-of-stock">Out of stock</span>
            ) : (
              <button className="quick-add-btn" onClick={(e) => quickAdd(e, p)}>
                {addedId === p._id ? "Added ✓" : p.variants?.length > 0 ? "Choose options" : "Add to cart"}
              </button>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
