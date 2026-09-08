import { z } from "zod";
import { buildCrudRouter } from "./crudRouter";
import { makeCrudController } from "../controllers/crudFactory";
import { getBrandModel } from "../models/tenant/Catalog";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const createSchema = z.object({
  name: z.string().min(1),
  logo: z.string().optional(),
  skuPrefix: z.string().optional(),
  description: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  countryOrigin: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  popular: z.boolean().optional(),
  featured: z.boolean().optional(),
}).transform((d) => ({ ...d, slug: slugify(d.name) }));

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  logo: z.string().optional(),
  skuPrefix: z.string().optional(),
  description: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  countryOrigin: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  popular: z.boolean().optional(),
  featured: z.boolean().optional(),
});

const handlers = makeCrudController({
  getModel: getBrandModel,
  createSchema,
  updateSchema,
  searchFields: ["name"],
});

export default buildCrudRouter(handlers);
