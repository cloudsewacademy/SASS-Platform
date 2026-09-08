import { z } from "zod";
import { buildCrudRouter } from "./crudRouter";
import { makeCrudController } from "../controllers/crudFactory";
import { getCustomerModel } from "../models/tenant/Customer";

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(5),
  // Treat an empty string the same as "not provided" instead of failing
  // .email() validation — form fields (including browser autofill) can
  // submit "" for an untouched optional field even when the client tries
  // to omit it.
  email: z.preprocess((v) => (v === "" ? undefined : v), z.string().email().optional()),
  notes: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
});

const handlers = makeCrudController({
  getModel: getCustomerModel,
  createSchema,
  searchFields: ["name", "phone", "email"],
});

export default buildCrudRouter(handlers);
