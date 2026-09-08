import { Request, Response } from "express";
import { z } from "zod";
import { getProductModel } from "../models/tenant/Product";

export async function listProducts(req: Request, res: Response) {
  const Product = getProductModel(req.tenantConn!);
  const { search, status, lowStockOnly, page = "1", limit = "20" } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (search) filter.$text = { $search: search };

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 20, 100);

  let products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  if (lowStockOnly === "true") {
    products = products.filter((p) => {
      if (p.variants.length > 0) return p.variants.some((v) => v.stock <= p.lowStockThreshold);
      return p.stock <= p.lowStockThreshold;
    });
  }

  const total = await Product.countDocuments(filter);
  // `items` (generic key, used by the shared useCrud hook on the frontend)
  // and `products` (kept for backward-compat with any caller reading the
  // old key name) both point at the same array on purpose.
  res.json({ items: products, products, total, page: pageNum, limit: limitNum });
}

const createProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().optional(),
  images: z.array(z.string()).default([]),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  brandId: z.string().optional(),
  costPrice: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),
  variants: z
    .array(
      z.object({
        label: z.string(),
        sku: z.string(),
        price: z.number().positive().optional(),
        stock: z.number().min(0).default(0),
      })
    )
    .default([]),
  stock: z.number().min(0).default(0),
  unitsSold: z.number().min(0).optional(),
  lowStockThreshold: z.number().min(0).default(5),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  seo: z
    .object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      keywords: z.string().optional(),
    })
    .optional(),
  badges: z
    .object({
      trending: z.boolean().optional(),
      bestSeller: z.boolean().optional(),
      displayUnitsSold: z.boolean().optional(),
    })
    .optional(),
});

export async function createProduct(req: Request, res: Response) {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid product payload", details: parsed.error.flatten() });
  }
  const Product = getProductModel(req.tenantConn!);
  const product = await Product.create(parsed.data);
  res.status(201).json(product);
}

export async function getProduct(req: Request, res: Response) {
  const Product = getProductModel(req.tenantConn!);
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
}

export async function updateProduct(req: Request, res: Response) {
  const parsed = createProductSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid product payload", details: parsed.error.flatten() });
  }
  const Product = getProductModel(req.tenantConn!);
  const product = await Product.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
}

export async function deleteProduct(req: Request, res: Response) {
  const Product = getProductModel(req.tenantConn!);
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json({ ok: true });
}

const adjustStockSchema = z.object({
  variantLabel: z.string().optional(),
  delta: z.number().int(), // positive to add stock, negative to remove
  reason: z.string().optional(),
});

/**
 * Manual stock adjustment (restock, damage write-off, recount correction).
 * Order-driven deductions happen inside orderController, not here.
 */
export async function adjustStock(req: Request, res: Response) {
  const parsed = adjustStockSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid adjustment payload" });

  const Product = getProductModel(req.tenantConn!);
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const { variantLabel, delta } = parsed.data;

  if (variantLabel) {
    const variant = product.variants.find((v) => v.label === variantLabel);
    if (!variant) return res.status(404).json({ error: `Variant '${variantLabel}' not found` });
    variant.stock = Math.max(0, variant.stock + delta);
  } else {
    product.stock = Math.max(0, product.stock + delta);
  }

  await product.save();
  res.json(product);
}

export async function getLowStockProducts(req: Request, res: Response) {
  const Product = getProductModel(req.tenantConn!);
  const products = await Product.find({ status: "published" });

  const lowStock = products.filter((p) => {
    if (p.variants.length > 0) return p.variants.some((v) => v.stock <= p.lowStockThreshold);
    return p.stock <= p.lowStockThreshold;
  });

  res.json({ products: lowStock, count: lowStock.length });
}
