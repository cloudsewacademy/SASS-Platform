import { z } from "zod";
import { buildCrudRouter } from "./crudRouter";
import { makeCrudController } from "../controllers/crudFactory";
import { getIssueModel } from "../models/tenant/Support";

const createSchema = z.object({
  subject: z.string().min(1),
  description: z.string().min(1),
  relatedOrderNumber: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});
const updateSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

const handlers = makeCrudController({
  getModel: getIssueModel,
  createSchema,
  updateSchema,
  searchFields: ["subject", "description"],
});

export default buildCrudRouter(handlers);
