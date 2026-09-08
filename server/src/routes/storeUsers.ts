import { Router } from "express";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";
import { resolveTenant } from "../middleware/resolveTenant";
import { PlatformUser } from "../models/master/PlatformUser";

const router = Router();
router.use(requireAuth, resolveTenant);

router.get("/", async (req: Request, res: Response) => {
  const users = await PlatformUser.find({ "memberships.tenantId": req.tenant!._id }).select("-passwordHash");
  const members = users.map((u) => ({
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.memberships.find((m: any) => m.tenantId.toString() === (req.tenant!._id as any).toString())?.role,
  }));
  res.json({ members });
});

const inviteSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["admin", "staff"]).default("staff"),
});

/**
 * Invites a staff member to the current store. No email delivery is wired
 * up yet, so this generates a temporary password and returns it directly
 * in the response for the owner to share manually — swap for a real
 * invite-email flow (token link, password set on first login) later.
 */
router.post("/invite", async (req: Request, res: Response) => {
  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });
  const { name, email, role } = parsed.data;

  let user = await PlatformUser.findOne({ email });
  let tempPassword: string | undefined;

  if (!user) {
    tempPassword = crypto.randomBytes(6).toString("hex");
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    user = await PlatformUser.create({ name, email, passwordHash, memberships: [] });
  }

  const alreadyMember = user.memberships.some((m: any) => m.tenantId.toString() === (req.tenant!._id as any).toString());
  if (alreadyMember) {
    return res.status(409).json({ error: "This person is already a member of this store" });
  }

  user.memberships.push({ tenantId: req.tenant!._id as any, role });
  await user.save();

  res.status(201).json({
    id: user._id,
    name: user.name,
    email: user.email,
    role,
    tempPassword, // undefined if the user already had an account
  });
});

router.delete("/:userId", async (req: Request, res: Response) => {
  const user = await PlatformUser.findById(req.params.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.memberships = user.memberships.filter(
    (m: any) => m.tenantId.toString() !== (req.tenant!._id as any).toString()
  );
  await user.save();
  res.json({ ok: true });
});

export default router;
