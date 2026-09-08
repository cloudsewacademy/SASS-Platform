import { Router } from "express";
import { Request, Response } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { resolveTenant } from "../middleware/resolveTenant";
import { getOrderModel } from "../models/tenant/Order";

const router = Router();
router.use(requireAuth, resolveTenant);

/**
 * "Received" = orders marked paid regardless of delivery status.
 * "Settled" = paid AND delivered — money that has actually completed the
 * full cycle. There's no real payment-gateway ledger wired in yet; this
 * derives directly from Order.paymentStatus/status, which is accurate for
 * COD-heavy stores and a reasonable stand-in until a gateway integration
 * (eSewa/Khalti settlement webhooks) replaces it.
 */
router.get("/transactions", async (req: Request, res: Response) => {
  const Order = getOrderModel(req.tenantConn!);
  const { type = "received" } = req.query as Record<string, string>;

  const filter: Record<string, unknown> =
    type === "settled" ? { paymentStatus: "paid", status: "delivered" } : { paymentStatus: "paid" };

  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200);
  const total = orders.reduce((sum, o) => sum + o.total, 0);

  res.json({ transactions: orders, total, count: orders.length });
});

/**
 * COD reconciliation: cash-on-delivery orders that have been delivered
 * but not yet marked paid (cash collected by courier, not yet remitted
 * to the merchant) vs. ones already reconciled.
 */
router.get("/cod-reconciliation", async (req: Request, res: Response) => {
  const Order = getOrderModel(req.tenantConn!);

  const [pending, reconciled] = await Promise.all([
    Order.find({ paymentMethod: "cod", status: "delivered", paymentStatus: { $ne: "paid" } }).sort({
      createdAt: -1,
    }),
    Order.find({ paymentMethod: "cod", status: "delivered", paymentStatus: "paid" }).sort({ createdAt: -1 }),
  ]);

  res.json({
    pending: { orders: pending, total: pending.reduce((s, o) => s + o.total, 0) },
    reconciled: { orders: reconciled, total: reconciled.reduce((s, o) => s + o.total, 0) },
  });
});

router.patch("/cod-reconciliation/:orderId/mark-paid", async (req: Request, res: Response) => {
  const Order = getOrderModel(req.tenantConn!);
  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });
  order.paymentStatus = "paid";
  await order.save();
  res.json(order);
});

export default router;
