import { Outlet } from "react-router-dom";
import { CartProvider } from "../context/CartContext";
import { CustomerAuthProvider } from "../context/CustomerAuthContext";
import { useStoreSlug, useIsResolvingDomain } from "../context/ResolvedSlugContext";
import Landing from "../pages/Landing";

export default function StoreShell() {
  const slug = useStoreSlug();
  const resolving = useIsResolvingDomain();

  // No slug in the URL path yet — wait for domain resolution (checking
  // whether this hostname belongs to a store) before deciding what to
  // render, so a store's own domain doesn't flash the platform landing
  // page before resolving.
  if (!slug && resolving) return null;

  // Neither a URL path slug nor a resolved domain — this is the bare
  // platform domain (or local dev root), so show the platform's own
  // marketing landing page instead of a store.
  if (!slug) return <Landing />;

  return (
    <CustomerAuthProvider slug={slug}>
      <CartProvider slug={slug}>
        <Outlet />
      </CartProvider>
    </CustomerAuthProvider>
  );
}
