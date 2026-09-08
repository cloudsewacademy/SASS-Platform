import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { resolveTenant } from "../middleware/resolveTenant";
import {
  listProducts,
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/inventoryController";

const router = Router();
router.use(requireAuth, resolveTenant);

router.get("/", listProducts);
router.post("/", createProduct);
router.get("/:id", getProduct);
router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
