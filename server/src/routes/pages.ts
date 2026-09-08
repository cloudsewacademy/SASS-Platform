import { z } from "zod";
import { buildCrudRouter } from "./crudRouter";
import { makeCrudController } from "../controllers/crudFactory";
import { getPageModel } from "../models/tenant/Misc";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  showInNav: z.boolean().optional(),
}).transform((d) => ({ ...d, slug: slugify(d.title) }));

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  showInNav: z.boolean().optional(),
});

const handlers = makeCrudController({
  getModel: getPageModel,
  createSchema,
  updateSchema,
  searchFields: ["title"],
});

export default buildCrudRouter(handlers);
