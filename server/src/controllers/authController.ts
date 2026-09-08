import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { PlatformUser } from "../models/master/PlatformUser";
import { PlatformAdmin } from "../models/master/PlatformAdmin";
import { Tenant } from "../models/master/Tenant";

function signToken(userId: string, email: string) {
  return jwt.sign({ id: userId, email }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  } as jwt.SignOptions);
}

function signAdminToken(adminId: string, email: string) {
  return jwt.sign({ id: adminId, email, role: "platform_admin" }, process.env.ADMIN_JWT_SECRET as string, {
    expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || "12h",
  } as jwt.SignOptions);
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  storeName: z.string().min(1),
  category: z.string().optional(),
});

/**
 * Registers a new merchant: creates their platform user AND their first
 * tenant (store) in one step, provisioning a brand-new isolated database
 * for that tenant. This mirrors Blanxer's "create your store" onboarding.
 */
export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }
  const { name, email, password, storeName, category } = parsed.data;

  const existing = await PlatformUser.findOne({ email });
  if (existing) return res.status(409).json({ error: "An account with this email already exists" });

  let slug = slugify(storeName);
  let suffix = 0;
  while (await Tenant.findOne({ slug: suffix ? `${slug}-${suffix}` : slug })) {
    suffix += 1;
  }
  if (suffix) slug = `${slug}-${suffix}`;

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await PlatformUser.create({ name, email, passwordHash, memberships: [] });

  const tenant = await Tenant.create({
    storeName,
    slug,
    dbName: slug.replace(/-/g, "_"),
    ownerUserId: user._id,
    category,
    contactEmail: email,
    status: "active", // no manual approval step in this scaffold; add if needed
    plan: "trial",
  });

  user.memberships.push({ tenantId: tenant._id as any, role: "owner" });
  await user.save();

  const token = signToken((user._id as any).toString(), user.email);
  res.status(201).json({
    token,
    user: { id: user._id, name: user.name, email: user.email },
    tenant: { id: tenant._id, slug: tenant.slug, storeName: tenant.storeName },
  });
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Single login endpoint for the whole platform — one form, two possible
 * outcomes. Checks PlatformAdmin first (a much smaller table, cheap to
 * check) and only falls through to PlatformUser if no admin account
 * matches that email. The two account types still live in separate
 * collections with separately-signed tokens under the hood (an admin
 * token is still only accepted by requireAdminAuth, a merchant token
 * only by requireAuth) — unifying the LOGIN FORM doesn't unify the
 * privilege boundary, it just spares the person from having to know in
 * advance which login page their account belongs to.
 */
export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const { email, password } = parsed.data;

  const admin = await PlatformAdmin.findOne({ email });
  if (admin) {
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });
    const token = signAdminToken((admin._id as any).toString(), admin.email);
    return res.json({ role: "admin", token, admin: { id: admin._id, name: admin.name, email: admin.email } });
  }

  const user = await PlatformUser.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid email or password" });

  const tenants = await Tenant.find({ _id: { $in: user.memberships.map((m: any) => m.tenantId) } }).select(
    "slug storeName plan status"
  );

  const token = signToken((user._id as any).toString(), user.email);
  res.json({ role: "merchant", token, user: { id: user._id, name: user.name, email: user.email }, tenants });
}
