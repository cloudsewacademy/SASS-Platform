import { Connection } from "mongoose";
import { ITenant } from "../models/master/Tenant";

declare global {
  namespace Express {
    interface Request {
      /** Set by requireAuth: the logged-in platform user's id + email */
      user?: { id: string; email: string };
      /** Set by resolveTenant: the tenant record + its own DB connection */
      tenant?: ITenant;
      tenantConn?: Connection;
    }
  }
}

export {};
