import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attaches the logged-in customer's token for THIS store (if any) to
// every request. Since customer sessions are scoped per store slug, this
// reads the token keyed by the slug found in the current URL path rather
// than a single global token — visiting a different store's pages never
// sends another store's customer token.
api.interceptors.request.use((config) => {
  const slug = window.location.pathname.split("/")[1];
  if (slug) {
    const token = localStorage.getItem(`customerToken:${slug}`);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

/**
 * Every image uploaded via the dashboard (product photos, brand logos,
 * category images, hero/banner images) is stored as a path relative to
 * the API server, e.g. "/uploads/tenant_x/file.png" — never a full URL.
 * The storefront runs on its own origin/port, so rendering that path
 * directly in an <img src> or CSS background-image resolves against the
 * storefront's own server and 404s. This resolves it against the actual
 * API origin. Absolute URLs (http/https, e.g. a pasted external image
 * link) are passed through unchanged.
 */
export function mediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_ORIGIN}${path}`;
}
