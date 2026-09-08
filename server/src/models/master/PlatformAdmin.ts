import { Schema, model, models, Document } from "mongoose";

/**
 * Platform (super-admin) accounts, deliberately kept in their own
 * collection rather than as a `role: "admin"` flag on PlatformUser.
 *
 * Why separate:
 *  - A bug in tenant-scoped auth/authorization code can never accidentally
 *    grant platform-admin powers, because platform admins simply aren't
 *    rows in the same table a tenant-owner login query touches.
 *  - Admin JWTs carry a distinct `role: "platform_admin"` claim checked by
 *    a dedicated `requireAdminAuth` middleware — completely separate code
 *    path from `requireAuth` (merchant/staff auth).
 *  - There is intentionally NO public self-registration route for this
 *    collection. Admins are created via `scripts/createAdmin.ts` (run
 *    directly on the server), so account creation always requires shell
 *    access to the box.
 */
export interface IPlatformAdmin extends Document {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const platformAdminSchema = new Schema<IPlatformAdmin>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

platformAdminSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    delete ret.passwordHash;
    return ret;
  },
});

export const PlatformAdmin =
  models.PlatformAdmin || model<IPlatformAdmin>("PlatformAdmin", platformAdminSchema);
