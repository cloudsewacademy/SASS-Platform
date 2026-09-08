import { Router } from "express";
import { Request, Response } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { resolveTenant } from "../middleware/resolveTenant";
import { getOrderModel } from "../models/tenant/Order";
import { getProductModel } from "../models/tenant/Product";

const router = Router();
router.use(requireAuth, resolveTenant);

router.get("/summary", async (req: Request, res: Response) => {
  const Order = getOrderModel(req.tenantConn!);
  const Product = getProductModel(req.tenantConn!);

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [totalRevenueAgg, orderCount, byStatus, byChannel, byDay, productCount, topProducts] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Order.aggregate([{ $group: { _id: "$channel", count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Product.countDocuments(),
    Order.aggregate([
      { $unwind: "$items" },
      { $group: { _id: "$items.name", quantity: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] } } } },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]),
  ]);

  res.json({
    totalRevenue: totalRevenueAgg[0]?.total ?? 0,
    orderCount,
    productCount,
    ordersByStatus: Object.fromEntries(byStatus.map((r) => [r._id, r.count])),
    ordersByChannel: Object.fromEntries(byChannel.map((r) => [r._id, r.count])),
    last30Days: byDay,
    topProducts,
  });
});

export default router;
