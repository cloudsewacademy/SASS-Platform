import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import StoreLayout from "../components/StoreLayout";
import { useStoreBasePath } from "../context/ResolvedSlugContext";

export default function Cart() {
  const basePath = useStoreBasePath();
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  return (
    <StoreLayout>
      {() => (
        <div className="cart-page">
          <h1>Your cart</h1>
          {items.length === 0 ? (
            <div className="empty-state-store">
              <p>Your cart is empty.</p>
              <button className="buy-btn" style={{ marginTop: 12 }} onClick={() => navigate(basePath || "/")}>
                Continue shopping
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantLabel ?? ""}`} className="cart-item">
                    <div className="cart-item-image">
                      {item.image ? <img src={item.image} alt={item.name} /> : <div className="product-image-placeholder" />}
                    </div>
                    <div className="cart-item-info">
                      <span className="product-name">{item.name}</span>
                      {item.variantLabel && <span className="muted">{item.variantLabel}</span>}
                      <span className="product-price">NPR {item.price.toLocaleString()}</span>
                    </div>
                    <div className="qty-stepper">
                      <button onClick={() => updateQuantity(item.productId, item.variantLabel, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.variantLabel, item.quantity + 1)}>+</button>
                    </div>
                    <span className="cart-line-total">NPR {(item.price * item.quantity).toLocaleString()}</span>
                    <button className="icon-btn" onClick={() => removeItem(item.productId, item.variantLabel)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="row-between">
                  <span>Subtotal</span>
                  <strong>NPR {subtotal.toLocaleString()}</strong>
                </div>
                <p className="muted">Shipping calculated at checkout.</p>
                <button className="buy-btn" style={{ width: "100%" }} onClick={() => navigate(`${basePath}/checkout`)}>
                  Proceed to checkout
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </StoreLayout>
  );
}
