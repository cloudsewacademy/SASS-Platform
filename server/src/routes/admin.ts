import { Router } from "express";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import {
  adminLogin,
  listUsers,
  getUserDetail,
  getPlatformStats,
  updateTenantStatus,
  getTenantActivity,
  getPlatformSettings,
  updatePlatformSettings,
} from "../controllers/adminController";

const router = Router();

router.post("/login", adminLogin);

router.use(requireAdminAuth);
router.get("/stats", getPlatformStats);
router.get("/users", listUsers);
router.get("/users/:id", getUserDetail);
router.patch("/tenants/:tenantId/status", updateTenantStatus);
router.get("/tenants/:tenantId/activity", getTenantActivity);
router.get("/platform-settings", getPlatformSettings);
router.patch("/platform-settings", updatePlatformSettings);

export default router;
