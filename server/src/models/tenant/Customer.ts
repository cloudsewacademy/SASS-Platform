import { Schema, Connection, Model, Document } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  passwordHash?: string;
  addresses: { line1: string; city: string; district?: string; province?: string }[];
  totalOrders: number;
  totalSpent: number;
  tags: string[];
  notes?: string;
  createdAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    passwordHash: String,
    addresses: [
      {
        line1: String,
        city: String,
        district: String,
        province: String,
      },
    ],
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    tags: [String],
    notes: String,
  },
  { timestamps: true }
);
customerSchema.index({ phone: 1 }, { unique: true });

// Same belt-and-suspenders pattern as PlatformUser/PlatformAdmin — strip
// the credential hash from every JSON response, even if a route forgets
// to .select("-passwordHash").
customerSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    delete ret.passwordHash;
    return ret;
  },
});

export function getCustomerModel(conn: Connection): Model<ICustomer> {
  return (conn.models.Customer as Model<ICustomer>) || conn.model<ICustomer>("Customer", customerSchema);
}
