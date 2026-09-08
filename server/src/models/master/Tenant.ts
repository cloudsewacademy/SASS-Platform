import { Schema, model, models, Document } from "mongoose";

export interface ITenant extends Document {
  storeName: string;
  slug: string; // used in URLs / subdomain, e.g. mayaa.yourplatform.com
  customDomain?: string; // e.g. "anishstore.com" — owner's own domain, DNS-pointed at the platform
  dbName: string; // physical DB name suffix, decoupled from slug on purpose
  ownerUserId: Schema.Types.ObjectId;
  plan: "trial" | "starter" | "growth" | "scale";
  status: "active" | "suspended" | "pending_setup";
  category?: string;
  contactEmail: string;
  contactPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const tenantSchema = new Schema<ITenant>(
  {
    storeName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    customDomain: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    dbName: { type: String, required: true, unique: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: "PlatformUser", required: true },
    plan: { type: String, enum: ["trial", "starter", "growth", "scale"], default: "trial" },
    status: { type: String, enum: ["active", "suspended", "pending_setup"], default: "pending_setup" },
    category: String,
    contactEmail: { type: String, required: true },
    contactPhone: String,
  },
  { timestamps: true }
);

export const Tenant = models.Tenant || model<ITenant>("Tenant", tenantSchema);
