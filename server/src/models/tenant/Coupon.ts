import { Schema, Connection, Model, Document } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderAmount: number;
  usageLimit?: number;
  usedCount: number;
  expiresAt?: Date;
  active: boolean;
  createdAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    type: { type: String, enum: ["percentage", "fixed"], required: true },
    value: { type: Number, required: true },
    minOrderAmount: { type: Number, default: 0 },
    usageLimit: Number,
    usedCount: { type: Number, default: 0 },
    expiresAt: Date,
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
couponSchema.index({ code: 1 }, { unique: true });

export function getCouponModel(conn: Connection): Model<ICoupon> {
  return (conn.models.Coupon as Model<ICoupon>) || conn.model<ICoupon>("Coupon", couponSchema);
}
