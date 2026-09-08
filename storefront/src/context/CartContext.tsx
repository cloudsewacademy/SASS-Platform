import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image?: string;
  variantLabel?: string;
  quantity: number;
  maxStock: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: string, variantLabel: string | undefined, quantity: number) => void;
  removeItem: (productId: string, variantLabel?: string) => void;
  clear: () => void;
  subtotal: number;
  itemCount: number;
}

const CartContext = createContext<CartState | null>(null);

function keyOf(productId: string, variantLabel?: string) {
  return `${productId}::${variantLabel ?? ""}`;
}

/**
 * Cart is scoped per store slug (separate localStorage key), so browsing
 * two different stores in two tabs never mixes their carts — there's no
 * server-side session tying a browser to one store.
 */
export function CartProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const storageKey = `cart:${slug}`;
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const k = keyOf(item.productId, item.variantLabel);
      const existing = prev.find((i) => keyOf(i.productId, i.variantLabel) === k);
      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, existing.maxStock);
        return prev.map((i) => (keyOf(i.productId, i.variantLabel) === k ? { ...i, quantity: nextQty } : i));
      }
      return [...prev, { ...item, quantity: Math.min(quantity, item.maxStock) }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, variantLabel: string | undefined, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          keyOf(i.productId, i.variantLabel) === keyOf(productId, variantLabel)
            ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((productId: string, variantLabel?: string) => {
    setItems((prev) => prev.filter((i) => keyOf(i.productId, i.variantLabel) !== keyOf(productId, variantLabel)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clear, subtotal, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
