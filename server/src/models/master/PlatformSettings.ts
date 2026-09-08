import { Schema, model, models, Document } from "mongoose";

/**
 * A SINGLE document living in the master DB — not tenant-scoped, not
 * per-store. This holds content for the platform's own marketing pages
 * (currently just the landing page), editable only by platform admins
 * via /api/admin/platform-settings and read publicly (no auth) via
 * /api/platform-settings for the Landing page to render.
 */
export interface IPlatformSettings extends Document {
  landingPage: {
    heroEyebrow: string;
    heroTitle: string;
    heroSubtitle: string;
    ctaText: string;
  };
  updatedAt: Date;
}

const platformSettingsSchema = new Schema<IPlatformSettings>(
  {
    landingPage: {
      heroEyebrow: { type: String, default: "Multi-tenant commerce platform" },
      heroTitle: { type: String, default: "Run your online store from one dashboard." },
      heroSubtitle: {
        type: String,
        default:
          "Orders, inventory, customers, coupons, payments, and your own fully customizable storefront — set up in minutes, isolated on your own database.",
      },
      ctaText: { type: String, default: "Create your store — free" },
    },
  },
  { timestamps: true }
);

export const PlatformSettings =
  models.PlatformSettings || model<IPlatformSettings>("PlatformSettings", platformSettingsSchema);

export async function getOrCreatePlatformSettings() {
  let doc = await PlatformSettings.findOne();
  if (!doc) doc = await PlatformSettings.create({});
  return doc;
}
