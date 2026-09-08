import { Router } from "express";
import { Request, Response } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { resolveTenant } from "../middleware/resolveTenant";
import { getSettingsModel, getOrCreateSettings } from "../models/tenant/Settings";
import { Tenant } from "../models/master/Tenant";

const router = Router();
router.use(requireAuth, resolveTenant);

/**
 * Custom domain lives on the master Tenant record (not the per-tenant
 * Settings document) since it's how the platform routes an incoming
 * request to the right tenant in the first place — a routing concern,
 * not store content. Actually pointing the domain's DNS at this
 * platform is on the store owner; this just tells the platform which
 * domain to expect and match against.
 */
router.get("/domain", async (req: Request, res: Response) => {
  res.json({ slug: req.tenant!.slug, customDomain: req.tenant!.customDomain || null });
});

router.patch("/domain", async (req: Request, res: Response) => {
  const raw = (req.body.customDomain || "").trim().toLowerCase();
  const customDomain = raw.replace(/^https?:\/\//, "").replace(/\/$/, "") || undefined;

  try {
    req.tenant!.customDomain = customDomain;
    await req.tenant!.save();
    res.json({ slug: req.tenant!.slug, customDomain: req.tenant!.customDomain || null });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "This domain is already in use by another store" });
    }
    throw err;
  }
});

router.get("/", async (req: Request, res: Response) => {
  const settings = await getOrCreateSettings(req.tenantConn!);
  res.json(settings);
});

// Deep-merges the given section (storeDetails | payments | socialLinks |
// appearance | header | navigation | footer | plugins) into the tenant's
// single Settings document.
router.patch("/:section", async (req: Request, res: Response) => {
  const validSections = [
    "storeDetails",
    "payments",
    "socialLinks",
    "appearance",
    "header",
    "navigation",
    "footer",
    "homepageSections",
    "plugins",
  ];
  const { section } = req.params;
  if (!validSections.includes(section)) {
    return res.status(400).json({ error: `Unknown settings section '${section}'` });
  }

  const settings = await getOrCreateSettings(req.tenantConn!);

  // Sections that are (or contain) arrays get replaced wholesale rather
  // than field-merged — merging array indices piecemeal would corrupt
  // ordering/removal (e.g. deleting the 2nd nav link) in confusing ways.
  const arrayReplaceSections = ["socialLinks", "navigation", "footer", "homepageSections"];
  if (arrayReplaceSections.includes(section)) {
    (settings as any)[section] = req.body[section] ?? req.body;
  } else {
    (settings as any)[section] = {
      ...((settings as any)[section]?.toObject?.() ?? (settings as any)[section]),
      ...req.body,
    };
  }
  await settings.save();
  res.json(settings);
});

export default router;
