import { Router } from "express";
import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth } from "../middleware/requireAuth";
import { resolveTenant } from "../middleware/resolveTenant";
import { getMediaModel } from "../models/tenant/Misc";

const router = Router();
router.use(requireAuth, resolveTenant);

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(UPLOAD_ROOT, req.tenant!.dbName);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.get("/", async (req: Request, res: Response) => {
  const Media = getMediaModel(req.tenantConn!);
  const items = await Media.find().sort({ createdAt: -1 });
  res.json({ items });
});

router.post("/", upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded (or unsupported file type)" });

  const Media = getMediaModel(req.tenantConn!);
  const url = `/uploads/${req.tenant!.dbName}/${req.file.filename}`;
  const media = await Media.create({
    filename: req.file.filename,
    url,
    mimeType: req.file.mimetype,
    size: req.file.size,
  });
  res.status(201).json(media);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const Media = getMediaModel(req.tenantConn!);
  const media = await Media.findByIdAndDelete(req.params.id);
  if (!media) return res.status(404).json({ error: "Not found" });

  const filePath = path.join(UPLOAD_ROOT, req.tenant!.dbName, media.filename);
  fs.unlink(filePath, () => {}); // best-effort; don't fail the request on FS errors

  res.json({ ok: true });
});

export default router;
