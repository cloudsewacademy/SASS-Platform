import { Schema, Connection, Model, Document } from "mongoose";

export interface IOrderItem {
  productId: Schema.Types.ObjectId;
  name: string;
  sku: string;
  variantLabel?: string;
  quantity: number;
  unitPrice: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  channel: "web" | "pos" | "manual";
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  shippingAddress?: {
    line1: string;
    city: string;
    district?: string;
    province?: string;
  };
  items: IOrderItem[];
  subtotal: number;
  shippingCharge: number;
  discount: number;
  total: number;
  paymentMethod: "cod" | "esewa" | "khalti" | "fonepay" | "card" | "connectips";
  paymentStatus: "pending" | "paid" | "refunded" | "failed";
  status: "pending" | "confirmed" | "processing" | "dispatched" | "delivered" | "cancelled";
  logisticsProvider?: "pathao" | "ncm" | "aramex" | "dash" | "upaya" | "fabbud" | "pickdrop";
  trackingId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    variantLabel: String,
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    channel: { type: String, enum: ["web", "pos", "manual"], default: "web" },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: String,
    },
    shippingAddress: {
      line1: String,
      city: String,
      district: String,
      province: String,
    },
    items: { type: [orderItemSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
    subtotal: { type: Number, required: true },
    shippingCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["cod", "esewa", "khalti", "fonepay", "card", "connectips"],
      default: "cod",
    },
    paymentStatus: { type: String, enum: ["pending", "paid", "refunded", "failed"], default: "pending" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "dispatched", "delivered", "cancelled"],
      default: "pending",
    },
    logisticsProvider: {
      type: String,
      enum: ["pathao", "ncm", "aramex", "dash", "upaya", "fabbud", "pickdrop"],
    },
    trackingId: String,
    notes: String,
  },
  { timestamps: true }
);

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ "customer.phone": 1 });

export function getOrderModel(conn: Connection): Model<IOrder> {
  return (conn.models.Order as Model<IOrder>) || conn.model<IOrder>("Order", orderSchema);
}
