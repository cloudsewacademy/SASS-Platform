import { Request, Response } from "express";
import { Connection, Model } from "mongoose";
import { ZodSchema } from "zod";

interface CrudOptions<T> {
  getModel: (conn: Connection) => Model<T>;
  createSchema?: ZodSchema;
  updateSchema?: ZodSchema;
  searchFields?: string[];
  defaultSort?: Record<string, 1 | -1>;
}

/**
 * Generates standard list/get/create/update/delete handlers for a
 * tenant-scoped resource. Used for the simpler CRUD areas (categories,
 * brands, leads, issues, coupons, reviews, pages, blog posts) so each one
 * doesn't need a hand-written, nearly-identical controller file.
 * Resources with real business logic (orders, inventory) keep their own
 * dedicated controllers instead of using this.
 */
export function makeCrudController<T>({
  getModel,
  createSchema,
  updateSchema,
  searchFields = [],
  defaultSort = { createdAt: -1 },
}: CrudOptions<T>) {
  async function list(req: Request, res: Response) {
    const Model = getModel(req.tenantConn!);
    const { search, status, page = "1", limit = "50" } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (search && searchFields.length) {
      filter.$or = searchFields.map((f) => ({ [f]: { $regex: search, $options: "i" } }));
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(parseInt(limit, 10) || 50, 200);

    const [items, total] = await Promise.all([
      Model.find(filter)
        .sort(defaultSort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Model.countDocuments(filter),
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum });
  }

  async function getOne(req: Request, res: Response) {
    const Model = getModel(req.tenantConn!);
    const item = await Model.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  }

  async function create(req: Request, res: Response) {
    let payload = req.body;
    if (createSchema) {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
      }
      payload = parsed.data;
    }
    const Model = getModel(req.tenantConn!);
    try {
      const item = await Model.create(payload);
      res.status(201).json(item);
    } catch (err: any) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "A record with this value already exists" });
      }
      throw err;
    }
  }

  async function update(req: Request, res: Response) {
    let payload = req.body;
    if (updateSchema) {
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
      }
      payload = parsed.data;
    }
    const Model = getModel(req.tenantConn!);
    const item = await Model.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  }

  async function remove(req: Request, res: Response) {
    const Model = getModel(req.tenantConn!);
    const item = await Model.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  }

  return { list, getOne, create, update, remove };
}
