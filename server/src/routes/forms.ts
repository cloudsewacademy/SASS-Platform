import { Router } from "express";
import { Request, Response } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";
import { resolveTenant } from "../middleware/resolveTenant";
import { getCustomFormModel, getFormSubmissionModel } from "../models/tenant/CustomForm";

const router = Router();
router.use(requireAuth, resolveTenant);

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const fieldSchema = z.object({
  label: z.string().min(1),
  type: z.enum(["text", "email", "phone", "textarea", "select"]).default("text"),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
});

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(fieldSchema).default([]),
  successMessage: z.string().optional(),
  createLead: z.boolean().optional(),
});

router.get("/", async (req: Request, res: Response) => {
  const Form = getCustomFormModel(req.tenantConn!);
  const forms = await Form.find().sort({ createdAt: -1 });
  res.json({ items: forms });
});

router.post("/", async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });

  const Form = getCustomFormModel(req.tenantConn!);
  const form = await Form.create({ ...parsed.data, slug: slugify(parsed.data.title) });
  res.status(201).json(form);
});

router.patch("/:id", async (req: Request, res: Response) => {
  const parsed = createSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const Form = getCustomFormModel(req.tenantConn!);
  const update: any = { ...parsed.data };
  if (parsed.data.title) update.slug = slugify(parsed.data.title);

  const form = await Form.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!form) return res.status(404).json({ error: "Form not found" });
  res.json(form);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const Form = getCustomFormModel(req.tenantConn!);
  const form = await Form.findByIdAndDelete(req.params.id);
  if (!form) return res.status(404).json({ error: "Form not found" });
  res.json({ ok: true });
});

router.get("/:id/submissions", async (req: Request, res: Response) => {
  const Submission = getFormSubmissionModel(req.tenantConn!);
  const submissions = await Submission.find({ formId: req.params.id }).sort({ createdAt: -1 }).limit(200);
  res.json({ items: submissions });
});

export default router;
