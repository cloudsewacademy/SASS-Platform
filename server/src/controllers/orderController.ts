import { Request, Response } from "express";
import { Connection } from "mongoose";
import { z } from "zod";
import { getOrderModel } from "../models/tenant/Order";
import { getProductModel } from "../models/tenant/Product";
import { getCustomerModel } from "../models/tenant/Customer";
import { generateOrderNumber } from "../utils/generateOrderNumber";

export const createOrderSchema = z.object({
  channel: z.enum(["web", "pos", "manual"]).default("manual"),
  customer: z.object({
    name: z.string().min(1),
    phone: z.string().min(5),
    email: z.preprocess((v) => (v === "" ? undefined : v), z.string().email().optional()),
  }),
  shippingAddress: z
    .object({
      line1: z.string(),
      city: z.string(),
      district: z.string().optional(),
      province: z.string().optional(),
    })
    .optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantLabel: z.string().optional(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  shippingCharge: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  paymentMethod: z.enum(["cod", "esewa", "khalti", "fonepay", "card", "connectips"]).default("cod"),
  notes: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export class OrderCreationError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * The actual order-creation logic (stock validation/deduction, customer
 * upsert, order record creation) lives here, independent of Express
 * request/response — so both the authenticated staff route
 * (createOrder below) and the public storefront checkout route
 * (routes/public.ts) share the exact same stock-safety guarantees
 * instead of two copies of this logic drifting apart over time.
 */
export async function createOrderCore(conn: Connection, body: CreateOrderInput) {
  const Product = getProductModel(conn);
  const Order = getOrderModel(conn);

  const resolvedItems = [];
  let subtotal = 0;

  for (const line of body.items) {
    const product = await Product.findById(line.productId);
    if (!product) {
      throw new OrderCreationError(404, `Product ${line.productId} not found`);
    }

    let availableStock = product.stock;
    let unitPrice = product.price;
    let variant = null;

    if (line.variantLabel) {
      variant = product.variants.find((v) => v.label === line.variantLabel);
      if (!variant) {
        throw new OrderCreationError(404, `Variant '${line.variantLabel}' not found on ${product.name}`);
      }
      availableStock = variant.stock;
      unitPrice = variant.price ?? product.price;
    }

    if (availableStock < line.quantity) {
      throw new OrderCreationError(
        409,
        `Insufficient stock for ${product.name}${line.variantLabel ? ` (${line.variantLabel})` : ""}. Available: ${availableStock}, requested: ${line.quantity}`
      );
    }

    resolvedItems.push({
      productId: product._id,
      name: product.name,
      sku: variant?.sku ?? product.sku,
      variantLabel: line.variantLabel,
      quantity: line.quantity,
      unitPrice,
    });
    subtotal += unitPrice * line.quantity;

    if (line.variantLabel && variant) {
      variant.stock -= line.quantity;
    } else {
      product.stock -= line.quantity;
    }
    await product.save();
  }

  const total = subtotal + body.shippingCharge - body.discount;

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    channel: body.channel,
    customer: body.customer,
    shippingAddress: body.shippingAddress,
    items: resolvedItems,
    subtotal,
    shippingCharge: body.shippingCharge,
    discount: body.discount,
    total,
    paymentMethod: body.paymentMethod,
    notes: body.notes,
  });

  await upsertCustomerFromOrderCore(conn, body.customer.phone, body.customer.name, total, body.shippingAddress);

  return order;
}

/**
 * Creates an order and atomically decrements stock for each line item.
 * If any item doesn't have enough stock, the whole order is rejected —
 * no partial orders, no oversold inventory.
 */
export async function createOrder(req: Request, res: Response) {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid order payload", details: parsed.error.flatten() });
  }

  try {
    const order = await createOrderCore(req.tenantConn!, parsed.data);
    res.status(201).json(order);
  } catch (err) {
    if (err instanceof OrderCreationError) {
      return res.status(err.status).json({ error: err.message });
    }
    throw err;
  }
}

/**
 * Upserts a Customer record from order details — keeps a running
 * totalOrders/totalSpent without requiring a separate manual entry step.
 */
async function upsertCustomerFromOrderCore(conn: Connection, phone: string, name: string, total: number, address?: any) {
  const Customer = getCustomerModel(conn);
  const update: any = {
    $set: { name },
    $inc: { totalOrders: 1, totalSpent: total },
  };
  if (address) update.$addToSet = { addresses: address };
  await Customer.findOneAndUpdate({ phone }, update, { upsert: true, new: true });
}

export async function listOrders(req: Request, res: Response) {
  const conn = req.tenantConn!;
  const Order = getOrderModel(conn);

  const { status, channel, search, from, to, page = "1", limit = "20" } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (channel) filter.channel = channel;
  if (from || to) {
    filter.createdAt = {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(to ? { $lte: new Date(to) } : {}),
    };
  }
  if (search) {
    filter.$or = [
      { orderNumber: { $regex: search, $options: "i" } },
      { "customer.name": { $regex: search, $options: "i" } },
      { "customer.phone": { $regex: search, $options: "i" } },
    ];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 20, 100);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Order.countDocuments(filter),
  ]);

  res.json({ orders, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
}

export async function getOrder(req: Request, res: Response) {
  const Order = getOrderModel(req.tenantConn!);
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
}

const updateStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "dispatched", "delivered", "cancelled"]),
});

export async function updateOrderStatus(req: Request, res: Response) {
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid status" });

  const Order = getOrderModel(req.tenantConn!);
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  const previousStatus = order.status;
  order.status = parsed.data.status;

  // Restock automatically if an order is cancelled after stock was deducted.
  if (parsed.data.status === "cancelled" && previousStatus !== "cancelled") {
    const Product = getProductModel(req.tenantConn!);
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;
      if (item.variantLabel) {
        const variant = product.variants.find((v) => v.label === item.variantLabel);
        if (variant) variant.stock += item.quantity;
      } else {
        product.stock += item.quantity;
      }
      await product.save();
    }
  }

  await order.save();
  res.json(order);
}
