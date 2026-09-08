import { Router } from "express";
import { Request, Response } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";
import { resolveTenant } from "../middleware/resolveTenant";
import { getSmsLogModel } from "../models/tenant/Misc";

const router = Router();
router.use(requireAuth, resolveTenant);

router.get("/", async (req: Request, res: Response) => {
  const SmsLog = getSmsLogModel(req.tenantConn!);
  const logs = await SmsLog.find().sort({ createdAt: -1 }).limit(100);
  res.json({ logs });
});

const sendSchema = z.object({
  to: z.string().min(5),
  message: z.string().min(1).max(480),
});

/**
 * Stub SMS sender: logs the message and marks it "sent" without actually
 * hitting a gateway. Swap the body of this handler for a real provider
 * (e.g. Sparrow SMS, a Nepal-based aggregator) when ready — the log model
 * and route contract stay the same either way.
 */
router.post("/send", async (req: Request, res: Response) => {
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const SmsLog = getSmsLogModel(req.tenantConn!);
  const log = await SmsLog.create({ ...parsed.data, status: "sent" });
  res.status(201).json(log);
});

export default router;
