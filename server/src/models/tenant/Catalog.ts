import { Schema, Connection, Model, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  image?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  hideOnProductPages: boolean;
  createdAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true },
    image: String,
    description: String,
    seoTitle: String,
    seoDescription: String,
    hideOnProductPages: { type: Boolean, default: false },
  },
  { timestamps: true }
);
categorySchema.index({ slug: 1 }, { unique: true });

export function getCategoryModel(conn: Connection): Model<ICategory> {
  return (conn.models.Category as Model<ICategory>) || conn.model<ICategory>("Category", categorySchema);
}

export interface IBrand extends Document {
  name: string;
  slug: string;
  logo?: string;
  skuPrefix?: string;
  description?: string;
  categoryIds: Schema.Types.ObjectId[];
  countryOrigin?: string;
  status: "active" | "inactive";
  popular: boolean;
  featured: boolean;
  createdAt: Date;
}

const brandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true },
    logo: String,
    skuPrefix: { type: String, uppercase: true, trim: true },
    description: String,
    categoryIds: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    countryOrigin: String,
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    popular: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);
brandSchema.index({ slug: 1 }, { unique: true });

export function getBrandModel(conn: Connection): Model<IBrand> {
  return (conn.models.Brand as Model<IBrand>) || conn.model<IBrand>("Brand", brandSchema);
}
