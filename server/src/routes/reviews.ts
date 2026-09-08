import { z } from "zod";
import { buildCrudRouter } from "./crudRouter";
import { makeCrudController } from "../controllers/crudFactory";
import { getReviewModel } from "../models/tenant/Support";

const createSchema = z.object({
  productId: z.string(),
  customerName: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});
const updateSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
});

const handlers = makeCrudController({
  getModel: getReviewModel,
  createSchema,
  updateSchema,
  searchFields: ["customerName", "comment"],
});

export default buildCrudRouter(handlers);
