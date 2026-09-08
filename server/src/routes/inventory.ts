import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { resolveTenant } from "../middleware/resolveTenant";
import {
  listProducts,
  createProduct,
  adjustStock,
  getLowStockProducts,
} from "../controllers/inventoryController";

const router = Router();

router.use(requireAuth, resolveTenant);

router.get("/products", listProducts);
router.post("/products", createProduct);
router.patch("/products/:id/stock", adjustStock);
router.get("/low-stock", getLowStockProducts);

export default router;
