import { z } from "zod";
import { buildCrudRouter } from "./crudRouter";
import { makeCrudController } from "../controllers/crudFactory";
import { getCouponModel } from "../models/tenant/Coupon";

const createSchema = z.object({
  code: z.string().min(2),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().positive(),
  minOrderAmount: z.number().min(0).optional(),
  usageLimit: z.number().positive().optional(),
  expiresAt: z.string().optional(),
});
const updateSchema = z.object({
  active: z.boolean().optional(),
  value: z.number().positive().optional(),
});

const handlers = makeCrudController({
  getModel: getCouponModel,
  createSchema,
  updateSchema,
  searchFields: ["code"],
});

export default buildCrudRouter(handlers);
