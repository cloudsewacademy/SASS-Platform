import { z } from "zod";
import { buildCrudRouter } from "./crudRouter";
import { makeCrudController } from "../controllers/crudFactory";
import { getBlogPostModel } from "../models/tenant/Misc";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  coverImage: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
}).transform((d) => ({ ...d, slug: slugify(d.title) }));

const handlers = makeCrudController({
  getModel: getBlogPostModel,
  createSchema,
  searchFields: ["title"],
});

export default buildCrudRouter(handlers);
