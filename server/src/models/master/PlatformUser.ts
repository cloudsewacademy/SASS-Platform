import { Schema, model, models, Document } from "mongoose";

/**
 * A person who can log into the platform. A user can own/belong to one
 * or more tenants (stores) — e.g. an agency running multiple brands.
 */
export interface ITenantMembership {
  tenantId: Schema.Types.ObjectId;
  role: "owner" | "admin" | "staff";
}

export interface IPlatformUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  memberships: ITenantMembership[];
  createdAt: Date;
  updatedAt: Date;
}

const membershipSchema = new Schema<ITenantMembership>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    role: { type: String, enum: ["owner", "admin", "staff"], default: "staff" },
  },
  { _id: false }
);

const platformUserSchema = new Schema<IPlatformUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    memberships: [membershipSchema],
  },
  { timestamps: true }
);

// Belt-and-suspenders: even if a route forgets `.select("-passwordHash")`,
// passwordHash is stripped from every JSON response and from console.log
// output. There is no legitimate reason any API response — admin or
// otherwise — should ever include a credential hash.
platformUserSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    delete ret.passwordHash;
    return ret;
  },
});

export const PlatformUser =
  models.PlatformUser || model<IPlatformUser>("PlatformUser", platformUserSchema);
