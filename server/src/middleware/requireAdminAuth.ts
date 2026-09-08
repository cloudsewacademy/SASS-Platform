import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AdminTokenPayload {
  id: string;
  email: string;
  role: "platform_admin";
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminTokenPayload;
    }
  }
}

/**
 * Verifies an admin-issued JWT (role: "platform_admin"). Deliberately does
 * NOT accept a regular merchant/staff token even if it were somehow signed
 * with the same secret — the role claim is checked explicitly, so the two
 * auth systems can never be used interchangeably.
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET as string) as AdminTokenPayload;
    if (payload.role !== "platform_admin") {
      return res.status(403).json({ error: "Not an admin token" });
    }
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired admin token" });
  }
}
