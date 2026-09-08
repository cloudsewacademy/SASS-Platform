import { BrowserRouter, Routes, Route } from "react-router-dom";
import Store from "./pages/Store";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import CmsPage from "./pages/CmsPage";
import CustomFormPage from "./pages/CustomFormPage";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import OrderStatus from "./pages/OrderStatus";
import StoreShell from "./components/StoreShell";
import { ResolvedSlugProvider } from "./context/ResolvedSlugContext";
import "./App.css";

/**
 * A single ":slug?" (optional) route segment serves three cases:
 *   - "/anish"            → path-mode, slug param = "anish"
 *   - "/anish/product/12" → path-mode, slug param = "anish"
 *   - "/" or "/product/12" on a store's own domain/subdomain → domain-mode,
 *     slug param is undefined; StoreShell resolves it via ResolvedSlugContext
 *     and renders the platform's own Landing page instead if nothing resolves
 *     (i.e. this is the bare platform domain, not any store's domain).
 */
export default function App() {
  return (
    <ResolvedSlugProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/:slug?" element={<StoreShell />}>
            <Route index element={<Store />} />
            <Route path="shop" element={<Shop />} />
            <Route path="product/:id" element={<ProductDetail />} />
            <Route path="page/:pageSlug" element={<CmsPage />} />
            <Route path="form/:formSlug" element={<CustomFormPage />} />
            <Route path="cart" element={<Cart />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="account" element={<Account />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="order/:orderNumber" element={<OrderStatus />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ResolvedSlugProvider>
  );
}
