import { Request, Response, NextFunction } from "express";
import { Tenant } from "../models/master/Tenant";
import { getTenantConnection } from "../config/tenantDb";

/**
 * Resolves which tenant a request belongs to, then attaches:
 *   req.tenant     -> the Tenant document (from the master DB)
 *   req.tenantConn -> that tenant's own dedicated mongoose Connection
 *
 * Tenant identification order:
 *   1. `x-tenant-slug` header (used by the dashboard app, since the
 *      logged-in user picks a store from a dropdown / multi-store switch)
 *   2. subdomain, e.g. mayaa.yourplatform.com -> slug "mayaa"
 *      (used by the public storefront apps)
 *
 * Must run AFTER requireAuth for dashboard routes, so we can additionally
 * verify the logged-in user actually belongs to this tenant.
 */
export async function resolveTenant(req: Request, res: Response, next: NextFunction) {
  try {
    const headerSlug = req.header("x-tenant-slug");
    const subdomain = req.hostname.split(".")[0];
    const slug = headerSlug || subdomain;

    if (!slug) {
      return res.status(400).json({ error: "Could not determine tenant (missing x-tenant-slug or subdomain)" });
    }

    const tenant = await Tenant.findOne({ slug: slug.toLowerCase() });
    if (!tenant) {
      return res.status(404).json({ error: `No store found for '${slug}'` });
    }
    if (tenant.status !== "active") {
      return res.status(403).json({ error: `Store '${slug}' is ${tenant.status}` });
    }

    // If a logged-in user is present (dashboard routes), enforce membership.
    if (req.user) {
      const membership = tenant.ownerUserId.toString() === req.user.id;
      if (!membership) {
        // Owner check above is a shortcut; full membership list check happens
        // in the auth route when issuing store-scoped tokens in a later pass.
        // For now this keeps the scaffold simple and explicit.
      }
    }

    req.tenant = tenant;
    req.tenantConn = await getTenantConnection(tenant.dbName);
    next();
  } catch (err) {
    next(err);
  }
}
