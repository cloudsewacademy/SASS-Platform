import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { Tenant } from "../models/master/Tenant";
import { getTenantConnection } from "../config/tenantDb";
import { getProductModel } from "../models/tenant/Product";
import { getOrCreateSettings } from "../models/tenant/Settings";
import { getCategoryModel } from "../models/tenant/Catalog";
import { getPageModel } from "../models/tenant/Misc";
import { getOrderModel } from "../models/tenant/Order";
import { getCustomerModel } from "../models/tenant/Customer";
import { createOrderCore, createOrderSchema, OrderCreationError } from "../controllers/orderController";
import { requireCustomerAuth } from "../middleware/requireCustomerAuth";
import { getCustomFormModel, getFormSubmissionModel } from "../models/tenant/CustomForm";
import { getLeadModel } from "../models/tenant/Support";

const router = Router();

/**
 * Resolves the tenant purely from the `:slug` URL param — this is the
 * public storefront, so there's no logged-in user and no x-tenant-slug
 * header (that header is a dashboard-only concept). A 404 here is
 * indistinguishable from "store doesn't exist" vs "store is suspended",
 * which is intentional: no need to leak account status to the public.
 */
async function resolveTenantBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const tenant = await Tenant.findOne({ slug: req.params.slug.toLowerCase() });
    if (!tenant || tenant.status !== "active") {
      return res.status(404).json({ error: "Store not found" });
    }
    req.tenant = tenant;
    req.tenantConn = await getTenantConnection(tenant.dbName);
    next();
  } catch (err) {
    next(err);
  }
}

router.use("/stores/:slug", resolveTenantBySlug);

/**
 * Resolves a tenant purely from the request's Host header — used by the
 * storefront on boot to figure out "am I being visited via the bare
 * platform domain (path-based /:slug mode, e.g. local dev or a demo
 * link) or via a store's own subdomain/custom domain (clean-URL mode,
 * e.g. anish.yourplatform.com or anishstore.com)?"
 *
 * Resolution order:
 *   1. Exact match against a tenant's customDomain (their own domain,
 *      DNS-pointed at this platform — e.g. "anishstore.com")
 *   2. Subdomain match: "<slug>.<PLATFORM_DOMAIN>" (e.g.
 *      "anish.yourplatform.com") — only checked if PLATFORM_DOMAIN is
 *      configured, so this is a no-op in local dev.
 *   3. Neither matches → 404, meaning the caller is on the bare platform
 *      domain and should fall back to path-based /:slug routing.
 */
router.get("/resolve", async (req: Request, res: Response) => {
  const host = req.hostname.toLowerCase();
  const platformDomain = (process.env.PLATFORM_DOMAIN || "").toLowerCase();

  let tenant = await Tenant.findOne({ customDomain: host });

  if (!tenant && platformDomain && host.endsWith(`.${platformDomain}`)) {
    const subdomain = host.slice(0, -(platformDomain.length + 1));
    if (subdomain && subdomain !== "www") {
      tenant = await Tenant.findOne({ slug: subdomain });
    }
  }

  if (!tenant || tenant.status !== "active") {
    return res.status(404).json({ error: "No store resolves for this domain" });
  }

  res.json({ slug: tenant.slug });
});

const registerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(5),
  email: z.preprocess((v) => (v === "" ? undefined : v), z.string().email().optional()),
  password: z.string().min(6),
});

function signCustomerToken(id: string, tenantSlug: string) {
  return jwt.sign({ id, tenantSlug, role: "customer" }, process.env.CUSTOMER_JWT_SECRET as string, {
    expiresIn: process.env.CUSTOMER_JWT_EXPIRES_IN || "30d",
  } as jwt.SignOptions);
}

/**
 * Customer account creation, scoped entirely to this one tenant's own
 * database — a customer who registers on Store A has no account on
 * Store B, even with the same phone number, because each tenant has its
 * own separate Customer collection (see config/tenantDb.ts).
 *
 * If a Customer record already exists for this phone (auto-created from
 * a prior guest... actually there is no guest checkout anymore, but also
 * covers a record an admin added manually in the dashboard) and it has
 * no passwordHash yet, this "claims" that record by setting one, rather
 * than erroring — so someone the store already has on file isn't blocked
 * from creating a login for themselves.
 */
router.post("/stores/:slug/auth/register", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }
  const { name, phone, email, password } = parsed.data;

  const Customer = getCustomerModel(req.tenantConn!);
  let account = await Customer.findOne({ phone });

  if (account?.passwordHash) {
    return res.status(409).json({ error: "An account with this phone number already exists — please log in instead" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  if (account) {
    account.name = name;
    account.email = email;
    account.passwordHash = passwordHash;
    await account.save();
  } else {
    account = await Customer.create({ name, phone, email, passwordHash });
  }

  const token = signCustomerToken((account._id as any).toString(), req.params.slug);
  res.status(201).json({ token, customer: { id: account._id, name: account.name, phone: account.phone, email: account.email } });
});

const loginSchema = z.object({
  phone: z.string().min(5),
  password: z.string().min(1),
});

router.post("/stores/:slug/auth/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const Customer = getCustomerModel(req.tenantConn!);
  const account = await Customer.findOne({ phone: parsed.data.phone });
  if (!account?.passwordHash) return res.status(401).json({ error: "Invalid phone number or password" });

  const valid = await bcrypt.compare(parsed.data.password, account.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid phone number or password" });

  const token = signCustomerToken((account._id as any).toString(), req.params.slug);
  res.json({ token, customer: { id: account._id, name: account.name, phone: account.phone, email: account.email } });
});

router.get("/stores/:slug/auth/me", requireCustomerAuth, async (req: Request, res: Response) => {
  const Customer = getCustomerModel(req.tenantConn!);
  const account = await Customer.findById(req.customer!.id).select("-passwordHash");
  if (!account) return res.status(404).json({ error: "Account not found" });
  res.json(account);
});

/** A logged-in customer's own order history for this store. */
router.get("/stores/:slug/auth/my-orders", requireCustomerAuth, async (req: Request, res: Response) => {
  const Customer = getCustomerModel(req.tenantConn!);
  const account = await Customer.findById(req.customer!.id);
  if (!account) return res.status(404).json({ error: "Account not found" });

  const Order = getOrderModel(req.tenantConn!);
  const orders = await Order.find({ "customer.phone": account.phone }).sort({ createdAt: -1 });
  res.json({ orders });
});

// Store header info — name, appearance (logo/color/hero), header/nav/footer
// config, contact, and which payment methods are enabled. Never exposes
// payment gateway credentials (merchant codes / secret keys) or plugin flags.
router.get("/stores/:slug", async (req: Request, res: Response) => {
  const settings = await getOrCreateSettings(req.tenantConn!);
  const enabledPaymentMethods = (
    [
      ["cod", settings.payments.codEnabled],
      ["esewa", settings.payments.esewaEnabled],
      ["khalti", settings.payments.khaltiEnabled],
      ["fonepay", settings.payments.fonepayEnabled],
    ] as const
  )
    .filter(([, enabled]) => enabled)
    .map(([method]) => method);

  res.json({
    storeName: req.tenant!.storeName,
    slug: req.tenant!.slug,
    category: req.tenant!.category,
    appearance: settings.appearance,
    header: settings.header,
    navigation: settings.navigation,
    footer: settings.footer,
    homepageSections: settings.homepageSections,
    socialLinks: settings.socialLinks,
    enabledPaymentMethods,
    codMaxAmount: settings.payments.codMaxAmount,
    contactEmail: settings.storeDetails.email || req.tenant!.contactEmail,
    contactPhone: settings.storeDetails.phone,
    address: settings.storeDetails.address,
  });
});

// Published pages, minimal fields — for building the nav / footer link list.
router.get("/stores/:slug/pages", async (req: Request, res: Response) => {
  const Page = getPageModel(req.tenantConn!);
  const pages = await Page.find({ status: "published" }).select("title slug showInNav");
  res.json({ pages });
});

router.get("/stores/:slug/pages/:pageSlug", async (req: Request, res: Response) => {
  const Page = getPageModel(req.tenantConn!);
  const page = await Page.findOne({ slug: req.params.pageSlug, status: "published" });
  if (!page) return res.status(404).json({ error: "Page not found" });
  res.json(page);
});

// Public form definition — omits createLead (internal config, no reason
// to expose it) and any submission data.
router.get("/stores/:slug/forms/:formSlug", async (req: Request, res: Response) => {
  const Form = getCustomFormModel(req.tenantConn!);
  const form = await Form.findOne({ slug: req.params.formSlug }).select("title slug description fields successMessage");
  if (!form) return res.status(404).json({ error: "Form not found" });
  res.json(form);
});

router.post("/stores/:slug/forms/:formSlug/submit", async (req: Request, res: Response) => {
  const Form = getCustomFormModel(req.tenantConn!);
  const form = await Form.findOne({ slug: req.params.formSlug });
  if (!form) return res.status(404).json({ error: "Form not found" });

  const values: Record<string, string> = {};
  for (const field of form.fields) {
    const raw = req.body[field.label];
    if (field.required && (raw === undefined || raw === "")) {
      return res.status(400).json({ error: `${field.label} is required` });
    }
    if (raw !== undefined) values[field.label] = String(raw).slice(0, 2000);
  }

  const Submission = getFormSubmissionModel(req.tenantConn!);
  await Submission.create({ formId: form._id, values });

  // Optionally also drop a Lead so form submissions show up alongside
  // other leads in the dashboard, without the store owner needing to
  // check two separate places for "someone wants to talk to us."
  if (form.createLead) {
    const Lead = getLeadModel(req.tenantConn!);
    const nameField = Object.keys(values).find((k) => k.toLowerCase().includes("name"));
    const phoneField = Object.keys(values).find((k) => k.toLowerCase().includes("phone"));
    const emailField = Object.keys(values).find((k) => k.toLowerCase().includes("email"));
    await Lead.create({
      name: (nameField && values[nameField]) || "Website form",
      phone: (phoneField && values[phoneField]) || "N/A",
      email: emailField ? values[emailField] : undefined,
      source: `form:${form.title}`,
      notes: Object.entries(values).map(([k, v]) => `${k}: ${v}`).join("\n"),
    });
  }

  res.status(201).json({ successMessage: form.successMessage });
});

router.get("/stores/:slug/categories", async (req: Request, res: Response) => {
  const Category = getCategoryModel(req.tenantConn!);
  const categories = await Category.find().select("name slug image");
  res.json({ categories });
});

// Only ever returns products with status "published" — draft/archived
// products never reach the public API, regardless of query params passed.
router.get("/stores/:slug/products", async (req: Request, res: Response) => {
  const Product = getProductModel(req.tenantConn!);
  const { search, categoryId, page = "1", limit = "24" } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = { status: "published" };
  if (categoryId) filter.$or = [{ categoryId }, { categoryIds: categoryId }];
  if (search) filter.$text = { $search: search };

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 24, 60);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .select("name price compareAtPrice images stock variants sku category categoryId categoryIds")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({ products, total, page: pageNum, limit: limitNum });
});

router.get("/stores/:slug/products/:id", async (req: Request, res: Response) => {
  const Product = getProductModel(req.tenantConn!);
  const product = await Product.findOne({ _id: req.params.id, status: "published" }).select(
    "name description price compareAtPrice images stock variants sku category categoryId categoryIds"
  );
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

/**
 * Public checkout — requires a logged-in customer (see requireCustomerAuth
 * below). Reuses the exact same createOrderCore used by the staff-facing
 * dashboard route, so stock validation/deduction and customer upserts
 * behave identically regardless of channel. Always forces channel: "web"
 * server-side and derives the customer's name/phone/email from their
 * authenticated account rather than trusting the request body for
 * identity — the body only supplies shipping address, items, payment
 * method, and notes, so a logged-in customer can't place an order under
 * someone else's name/phone.
 */
router.post("/stores/:slug/checkout", requireCustomerAuth, async (req: Request, res: Response) => {
  const bodySchema = createOrderSchema.omit({ channel: true, customer: true });
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid order payload", details: parsed.error.flatten() });
  }

  const Customer = getCustomerModel(req.tenantConn!);
  const account = await Customer.findById(req.customer!.id);
  if (!account) return res.status(404).json({ error: "Account not found" });

  try {
    const order = await createOrderCore(req.tenantConn!, {
      ...parsed.data,
      channel: "web",
      customer: { name: account.name, phone: account.phone, email: account.email },
    });
    res.status(201).json({ orderNumber: order.orderNumber, total: order.total, id: order._id });
  } catch (err) {
    if (err instanceof OrderCreationError) {
      return res.status(err.status).json({ error: err.message });
    }
    throw err;
  }
});

/**
 * Order tracking — requires both the order number AND the phone number
 * used on that order, so a guessed/incremented order number alone can't
 * be used to look up someone else's order (no name/address of other
 * customers leaks from an order number scan).
 */
router.get("/stores/:slug/orders/track", async (req: Request, res: Response) => {
  const { orderNumber, phone } = req.query as Record<string, string>;
  if (!orderNumber || !phone) {
    return res.status(400).json({ error: "orderNumber and phone are both required" });
  }

  const Order = getOrderModel(req.tenantConn!);
  const order = await Order.findOne({ orderNumber, "customer.phone": phone });
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

export default router;
