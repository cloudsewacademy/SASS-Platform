import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { resolveTenant } from "../middleware/resolveTenant";
import { createOrder, listOrders, getOrder, updateOrderStatus } from "../controllers/orderController";

const router = Router();

router.use(requireAuth, resolveTenant);

router.get("/", listOrders);
router.post("/", createOrder);
router.get("/:id", getOrder);
router.patch("/:id/status", updateOrderStatus);

export default router;
