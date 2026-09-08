import { Schema, Connection, Model, Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  sku: string;
  description?: string;
  images: string[];
  price: number;
  compareAtPrice?: number;
  currency: string;
  category?: string;
  categoryId?: Schema.Types.ObjectId;
  categoryIds: Schema.Types.ObjectId[];
  brandId?: Schema.Types.ObjectId;
  costPrice?: number;
  weight?: number;
  variants: {
    label: string; // e.g. "50ml", "Red / L"
    sku: string;
    price?: number;
    stock: number;
  }[];
  stock: number; // base stock when no variants are used
  unitsSold: number;
  lowStockThreshold: number;
  status: "draft" | "published" | "archived";
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
  };
  badges: {
    trending: boolean;
    bestSeller: boolean;
    displayUnitsSold: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const variantSchema = new Schema(
  {
    label: { type: String, required: true },
    sku: { type: String, required: true },
    price: Number,
    stock: { type: Number, default: 0 },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true },
    description: String,
    images: [String],
    price: { type: Number, required: true },
    compareAtPrice: Number,
    currency: { type: String, default: "NPR" },
    category: String,
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    brandId: { type: Schema.Types.ObjectId, ref: "Brand" },
    costPrice: Number,
    weight: Number,
    variants: [variantSchema],
    stock: { type: Number, default: 0 },
    unitsSold: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: String,
    },
    badges: {
      trending: { type: Boolean, default: false },
      bestSeller: { type: Boolean, default: false },
      displayUnitsSold: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ name: "text", sku: "text" });

/**
 * Each tenant has its own Connection (see config/tenantDb.ts), so the
 * Product model must be compiled per-connection rather than imported as
 * a single global model. Mongoose caches models per-connection under the
 * hood via conn.model(), so repeated calls with the same connection are
 * cheap and return the same compiled model.
 */
export function getProductModel(conn: Connection): Model<IProduct> {
  return (conn.models.Product as Model<IProduct>) || conn.model<IProduct>("Product", productSchema);
}
