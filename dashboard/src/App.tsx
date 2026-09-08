import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { DashboardThemeProvider } from "./context/DashboardThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Orders from "./pages/Orders";
import Inventory from "./pages/Inventory";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Brands from "./pages/Brands";
import Customers from "./pages/Customers";
import Reviews from "./pages/Reviews";
import Leads from "./pages/Leads";
import Issues from "./pages/Issues";
import Coupons from "./pages/Coupons";
import Analytics from "./pages/Analytics";
import Media from "./pages/Media";
import Finance from "./pages/Finance";
import Sms from "./pages/Sms";
import Content from "./pages/Content";
import Forms from "./pages/Forms";
import Plugins from "./pages/Plugins";
import Appearance from "./pages/Appearance";
import Settings from "./pages/Settings";
import StoreUsers from "./pages/StoreUsers";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminLandingPage from "./pages/admin/AdminLandingPage";
import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <DashboardThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<DashboardLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/store-users" element={<StoreUsers />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="/products" element={<Products />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/issues" element={<Issues />} />
              <Route path="/sms" element={<Sms />} />
              <Route path="/coupons" element={<Coupons />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/media" element={<Media />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/content" element={<Content />} />
              <Route path="/forms" element={<Forms />} />
              <Route path="/plugins" element={<Plugins />} />
              <Route path="/appearance" element={<Appearance />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="/admin/login" element={<Navigate to="/login" replace />} />
            <Route element={<AdminLayout />}>
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/landing-page" element={<AdminLandingPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </DashboardThemeProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}
