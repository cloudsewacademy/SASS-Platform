import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";

interface ResolvedSlugState {
  domainSlug: string | null;
  resolving: boolean;
}

const ResolvedSlugContext = createContext<ResolvedSlugState>({ domainSlug: null, resolving: true });

/**
 * Resolves which store the current hostname belongs to, once, on app
 * boot — this is what makes "anish.yourplatform.com" or a store's own
 * custom domain ("anishstore.com") work with a clean root URL instead of
 * requiring "/anish" in the path.
 *
 * Route paths use an OPTIONAL :slug segment (see App.tsx: "/:slug?"), so
 * the same route tree serves both:
 *   - path-mode (local dev, or a shared demo link): URL has "/anish/...",
 *     useParams().slug is set directly, this resolver is never consulted.
 *   - domain-mode (production, visiting the store's own domain): URL has
 *     no slug segment at all, useParams().slug is undefined, and
 *     useStoreSlug() falls back to whatever this resolves to.
 *
 * A 404 from /public/resolve is the expected, common case (it just means
 * "you're on the bare platform domain, not a store's own domain") — not
 * an error to surface to the user.
 */
export function ResolvedSlugProvider({ children }: { children: ReactNode }) {
  const [domainSlug, setDomainSlug] = useState<string | null>(null);
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    api
      .get("/public/resolve")
      .then(({ data }) => setDomainSlug(data.slug))
      .catch(() => setDomainSlug(null))
      .finally(() => setResolving(false));
  }, []);

  return <ResolvedSlugContext.Provider value={{ domainSlug, resolving }}>{children}</ResolvedSlugContext.Provider>;
}

/**
 * The slug for the store currently being viewed, regardless of whether
 * it came from the URL path or from domain resolution. Use this instead
 * of raw useParams<{slug}>() in every storefront page/component.
 */
export function useStoreSlug(): string | undefined {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const { domainSlug } = useContext(ResolvedSlugContext);
  return paramSlug || domainSlug || undefined;
}

/**
 * The URL prefix to use when building internal links. In path-mode this
 * is "/anish" (so links stay consistent with how the user arrived). In
 * domain-mode it's "" — the store's own domain already IS the store, so
 * links should be clean ("/product/123") rather than repeating the slug
 * ("/anish/product/123") in every URL.
 */
export function useStoreBasePath(): string {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  return paramSlug ? `/${paramSlug}` : "";
}

export function useIsResolvingDomain(): boolean {
  return useContext(ResolvedSlugContext).resolving;
}
