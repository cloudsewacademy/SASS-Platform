import { z } from "zod";
import { buildCrudRouter } from "./crudRouter";
import { makeCrudController } from "../controllers/crudFactory";
import { getCategoryModel } from "../models/tenant/Catalog";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const createSchema = z.object({
  name: z.string().min(1),
  image: z.string().optional(),
  description: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  hideOnProductPages: z.boolean().optional(),
}).transform((d) => ({ ...d, slug: slugify(d.name) }));

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  image: z.string().optional(),
  description: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  hideOnProductPages: z.boolean().optional(),
});

const handlers = makeCrudController({
  getModel: getCategoryModel,
  createSchema,
  updateSchema,
  searchFields: ["name"],
});

export default buildCrudRouter(handlers);
