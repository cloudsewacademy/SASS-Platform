import axios from "axios";

export const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Uses its own token (adminToken), stored and sent separately from the
// merchant `token` — an admin session and a merchant session are never
// the same credential, and this client never attaches `x-tenant-slug`,
// since admin routes don't operate inside any tenant's database.
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("adminToken");
      window.location.href = "/admin/login";
    }
    return Promise.reject(err);
  }
);
