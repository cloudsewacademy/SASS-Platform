import { Router, Request, Response } from "express";
import { getOrCreatePlatformSettings } from "../models/master/PlatformSettings";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const settings = await getOrCreatePlatformSettings();
  res.json(settings.landingPage);
});

export default router;
