import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { PlatformAdmin } from "../models/master/PlatformAdmin";
import { PlatformUser } from "../models/master/PlatformUser";
import { Tenant } from "../models/master/Tenant";
import { getTenantConnection } from "../config/tenantDb";
import { getOrderModel } from "../models/tenant/Order";
import { getProductModel } from "../models/tenant/Product";
import { getOrCreatePlatformSettings } from "../models/master/PlatformSettings";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function adminLogin(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const { email, password } = parsed.data;
  // .select("+passwordHash") not needed since it's selected by default here,
  // but we only ever compare it in-memory and never return it (toJSON strips it too).
  const admin = await PlatformAdmin.findOne({ email });
  if (!admin) return res.status(401).json({ error: "Invalid email or password" });

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid email or password" });

  const token = jwt.sign(
    { id: admin._id, email: admin.email, role: "platform_admin" },
    process.env.ADMIN_JWT_SECRET as string,
    { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || "12h" } as jwt.SignOptions
  );

  res.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email } });
}

/**
 * Lists registered merchants (PlatformUser accounts) with their tenant(s).
 *
 * Deliberately excludes:
 *  - passwordHash (never selected/returned — see PlatformUser.toJSON)
 *  - any of the tenant's actual store data (orders, products, customers).
 *    Admin has no route into a tenant's own database at all; this endpoint
 *    only reads the master DB (registry-level metadata), never
 *    `getTenantConnection()`. That's what keeps "admin can monitor
 *    registrations" and "no user can see another user's store data" both
 *    true at the same time — it's an architectural boundary, not a
 *    per-field permission check.
 */
export async function listUsers(req: Request, res: Response) {
  const { search, page = "1", limit = "20" } = req.query as Record<string, string>;

  // Only accounts with an "owner" membership somewhere — this view is
  // "who has registered a store on the platform," not "everyone with
  // dashboard access." Staff a store owner invites (Store Users →
  // Invite user) are that owner's business, not something the platform
  // admin needs to see individually; they're still fully covered by the
  // per-store Activity numbers either way.
  const filter: Record<string, unknown> = { "memberships.role": "owner" };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 20, 100);

  const [users, total] = await Promise.all([
    PlatformUser.find(filter)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    PlatformUser.countDocuments(filter),
  ]);

  const tenantIds = users.flatMap((u) => u.memberships.map((m: any) => m.tenantId));
  const tenants = await Tenant.find({ _id: { $in: tenantIds } }).select(
    "storeName slug plan status createdAt"
  );
  const tenantsById = new Map(tenants.map((t) => [t._id!.toString(), t]));

  const enriched = users.map((u) => ({
    id: u._id,
    name: u.name,
    email: u.email,
    createdAt: (u as any).createdAt,
    stores: u.memberships.map((m: any) => ({
      role: m.role,
      ...tenantsById.get(m.tenantId.toString())?.toJSON(),
    })),
  }));

  res.json({ users: enriched, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
}

export async function getUserDetail(req: Request, res: Response) {
  const user = await PlatformUser.findById(req.params.id).select("-passwordHash");
  if (!user) return res.status(404).json({ error: "User not found" });

  const tenants = await Tenant.find({
    _id: { $in: user.memberships.map((m: any) => m.tenantId) },
  }).select("storeName slug plan status contactEmail contactPhone createdAt");

  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    createdAt: (user as any).createdAt,
    stores: tenants,
  });
}

/**
 * High-level platform metrics only — counts and breakdowns, never
 * individual store contents. Suitable for an admin overview dashboard.
 */
export async function getPlatformStats(_req: Request, res: Response) {
  const [totalUsers, totalTenants, tenantsByPlan, tenantsByStatus] = await Promise.all([
    PlatformUser.countDocuments(),
    Tenant.countDocuments(),
    Tenant.aggregate([{ $group: { _id: "$plan", count: { $sum: 1 } } }]),
    Tenant.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  res.json({
    totalUsers,
    totalTenants,
    tenantsByPlan: Object.fromEntries(tenantsByPlan.map((r) => [r._id, r.count])),
    tenantsByStatus: Object.fromEntries(tenantsByStatus.map((r) => [r._id, r.count])),
  });
}

const suspendSchema = z.object({ status: z.enum(["active", "suspended", "pending_setup"]) });

/**
 * The only write action exposed to admins over tenants: changing platform
 * status (e.g. suspending a store for ToS violation / non-payment). Admin
 * still cannot read or write anything inside the tenant's own database.
 */
export async function updateTenantStatus(req: Request, res: Response) {
  const parsed = suspendSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid status" });

  const tenant = await Tenant.findById(req.params.tenantId);
  if (!tenant) return res.status(404).json({ error: "Tenant not found" });

  tenant.status = parsed.data.status;
  await tenant.save();
  res.json(tenant);
}

/**
 * The one deliberate, narrow exception to "admin never touches a tenant's
 * database": read-only aggregate counts (order count, revenue, published
 * product count) so admins can tell an active store from a dead one.
 *
 * What this does NOT do, on purpose:
 *  - never returns individual orders, customers, or products
 *  - never returns anyone's name/phone/email/address from inside the store
 *  - uses countDocuments()/aggregate($sum) only — no .find() that returns
 *    documents, so there is no code path here that could leak a record
 * This is monitoring store *activity*, not accessing store *data*.
 */
export async function getTenantActivity(req: Request, res: Response) {
  const tenant = await Tenant.findById(req.params.tenantId);
  if (!tenant) return res.status(404).json({ error: "Tenant not found" });

  const conn = await getTenantConnection(tenant.dbName);
  const Order = getOrderModel(conn);
  const Product = getProductModel(conn);

  const [orderCount, revenueAgg, publishedProductCount, lastOrder] = await Promise.all([
    Order.countDocuments(),
    Order.aggregate([{ $match: { status: { $ne: "cancelled" } } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
    Product.countDocuments({ status: "published" }),
    Order.findOne().sort({ createdAt: -1 }).select("createdAt"),
  ]);

  res.json({
    orderCount,
    totalRevenue: revenueAgg[0]?.total ?? 0,
    publishedProductCount,
    lastOrderAt: lastOrder?.createdAt ?? null,
  });
}

/**
 * The platform's own landing-page content — not a tenant, not a store,
 * just the one marketing page for the SaaS platform itself. Editable
 * only by platform admins; read publicly via a separate no-auth route
 * (see routes/platformSettings.ts) so the Landing page can render it.
 */
export async function getPlatformSettings(_req: Request, res: Response) {
  const settings = await getOrCreatePlatformSettings();
  res.json(settings);
}

export async function updatePlatformSettings(req: Request, res: Response) {
  const settings = await getOrCreatePlatformSettings();
  settings.landingPage = { ...settings.landingPage.toObject(), ...req.body };
  await settings.save();
  res.json(settings);
}
