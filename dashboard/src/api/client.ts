import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attach the logged-in user's token and the currently selected store's
// slug to every request. The active tenant slug is what lets one merchant
// switch between multiple stores without logging out (see Blanxer's
// "multi-store" pattern) — it's just a client-side selection that tells
// the backend which tenant DB to route the query to.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const activeTenantSlug = localStorage.getItem("activeTenantSlug");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (activeTenantSlug) config.headers["x-tenant-slug"] = activeTenantSlug;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
