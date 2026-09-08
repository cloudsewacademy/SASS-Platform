import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, mediaUrl } from "../api/client";
import { useStoreSlug, useStoreBasePath } from "../context/ResolvedSlugContext";
import { useCart } from "../context/CartContext";
import StoreLayout from "../components/StoreLayout";

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  stock: number;
  variants: { label: string; stock: number; price?: number }[];
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const slug = useStoreSlug();
  const basePath = useStoreBasePath();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!slug || !id) return;
    setLoading(true);
    api
      .get(`/public/stores/${slug}/products/${id}`)
      .then(({ data }) => {
        setProduct(data);
        if (data.variants?.length > 0) setSelectedVariant(data.variants[0].label);
      })
      .finally(() => setLoading(false));
  }, [slug, id]);

  function currentStock() {
    if (!product) return 0;
    if (product.variants?.length > 0) {
      return product.variants.find((v) => v.label === selectedVariant)?.stock ?? 0;
    }
    return product.stock;
  }

  function currentPrice() {
    if (!product) return 0;
    if (product.variants?.length > 0) {
      return product.variants.find((v) => v.label === selectedVariant)?.price ?? product.price;
    }
    return product.price;
  }

  function handleAddToCart() {
    if (!product) return;
    addItem(
      {
        productId: product._id,
        name: product.name,
        price: currentPrice(),
        image: mediaUrl(product.images?.[0]),
        variantLabel: product.variants?.length > 0 ? selectedVariant : undefined,
        maxStock: currentStock(),
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <StoreLayout>
      {() =>
        loading ? (
          <p>Loading...</p>
        ) : !product ? (
          <p>Product not found.</p>
        ) : (
          <div className="product-detail">
            <div className="product-detail-image">
              {product.images?.[0] ? (
                <img src={mediaUrl(product.images[0])} alt={product.name} />
              ) : (
                <div className="product-image-placeholder" />
              )}
            </div>
            <div className="product-detail-info">
              <h1>{product.name}</h1>
              <p className="product-detail-price">
                NPR {currentPrice().toLocaleString()}
                {product.compareAtPrice && product.compareAtPrice > currentPrice() && (
                  <span className="product-compare">NPR {product.compareAtPrice.toLocaleString()}</span>
                )}
              </p>
              {product.description && <p className="product-detail-desc">{product.description}</p>}

              {product.variants?.length > 0 && (
                <div className="variant-picker">
                  {product.variants.map((v) => (
                    <button
                      key={v.label}
                      className={v.label === selectedVariant ? "variant-chip active" : "variant-chip"}
                      disabled={v.stock <= 0}
                      onClick={() => setSelectedVariant(v.label)}
                    >
                      {v.label} {v.stock <= 0 && "(out)"}
                    </button>
                  ))}
                </div>
              )}

              <div className="qty-row">
                <label>Qty</label>
                <div className="qty-stepper">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>-</button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(currentStock(), q + 1))}>+</button>
                </div>
                <span className="muted">{currentStock()} in stock</span>
              </div>

              <div className="product-actions">
                <button className="buy-btn" disabled={currentStock() <= 0} onClick={handleAddToCart}>
                  {added ? "Added to cart ✓" : currentStock() > 0 ? "Add to cart" : "Out of stock"}
                </button>
                <button
                  className="buy-btn-secondary"
                  disabled={currentStock() <= 0}
                  onClick={() => {
                    handleAddToCart();
                    navigate(`${basePath}/checkout`);
                  }}
                >
                  Buy now
                </button>
              </div>
            </div>
          </div>
        )
      }
    </StoreLayout>
  );
}
