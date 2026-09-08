import { useState, useEffect, useCallback } from "react";
import { api } from "./client";

/**
 * Thin data hook around the generic CRUD REST endpoints (list/create/
 * update/delete) that crudFactory.ts generates on the server. Used by
 * every simple resource page (categories, brands, leads, issues, coupons,
 * reviews, pages, blog, customers) so they don't each hand-roll fetch
 * logic.
 */
export function useCrud<T extends { _id: string }>(resource: string, params: Record<string, string> = {}) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paramsKey = JSON.stringify(params);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/${resource}`, { params });
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(data.total ?? 0);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource, paramsKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(payload: Partial<T>) {
    const { data } = await api.post(`/${resource}`, payload);
    await load();
    return data;
  }

  async function update(id: string, payload: Partial<T>) {
    const { data } = await api.patch(`/${resource}/${id}`, payload);
    await load();
    return data;
  }

  async function remove(id: string) {
    await api.delete(`/${resource}/${id}`);
    await load();
  }

  return { items, total, loading, error, reload: load, create, update, remove };
}
