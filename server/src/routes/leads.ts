import { z } from "zod";
import { buildCrudRouter } from "./crudRouter";
import { makeCrudController } from "../controllers/crudFactory";
import { getLeadModel } from "../models/tenant/Support";

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(5),
  email: z.preprocess((v) => (v === "" ? undefined : v), z.string().email().optional()),
  source: z.string().optional(),
  notes: z.string().optional(),
});
const updateSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "converted", "lost"]).optional(),
  notes: z.string().optional(),
});

const handlers = makeCrudController({
  getModel: getLeadModel,
  createSchema,
  updateSchema,
  searchFields: ["name", "phone", "email"],
});

export default buildCrudRouter(handlers);
