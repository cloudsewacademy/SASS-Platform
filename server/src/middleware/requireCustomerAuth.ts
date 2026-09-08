import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Tenant } from "../models/master/Tenant";
import { getTenantConnection } from "../config/tenantDb";

export interface CustomerTokenPayload {
  id: string;
  tenantSlug: string;
  role: "customer";
}

declare global {
  namespace Express {
    interface Request {
      customer?: CustomerTokenPayload;
    }
  }
}

/**
 * Verifies a storefront customer's JWT (role: "customer", scoped to one
 * tenantSlug) and resolves the tenant's connection the same way
 * resolveTenant does for staff — but from the URL's :slug param (public
 * routes), not a header or logged-in staff session. A customer token
 * issued for one store can't be replayed against another store's data:
 * the tenantSlug embedded in the token must match the :slug in the URL.
 */
export async function requireCustomerAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Please log in to continue" });
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, process.env.CUSTOMER_JWT_SECRET as string) as CustomerTokenPayload;
    if (payload.role !== "customer") {
      return res.status(403).json({ error: "Invalid token" });
    }
    if (payload.tenantSlug !== req.params.slug) {
      return res.status(403).json({ error: "This login isn't valid for this store" });
    }

    const tenant = await Tenant.findOne({ slug: payload.tenantSlug });
    if (!tenant || tenant.status !== "active") {
      return res.status(404).json({ error: "Store not found" });
    }

    req.customer = payload;
    req.tenant = tenant;
    req.tenantConn = await getTenantConnection(tenant.dbName);
    next();
  } catch {
    return res.status(401).json({ error: "Your session has expired — please log in again" });
  }
}
