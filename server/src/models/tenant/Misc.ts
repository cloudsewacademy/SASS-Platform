import { Schema, Connection, Model, Document } from "mongoose";

export interface IMedia extends Document {
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

const mediaSchema = new Schema<IMedia>(
  {
    filename: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { timestamps: true }
);

export function getMediaModel(conn: Connection): Model<IMedia> {
  return (conn.models.Media as Model<IMedia>) || conn.model<IMedia>("Media", mediaSchema);
}

export interface ISmsLog extends Document {
  to: string;
  message: string;
  status: "sent" | "failed";
  createdAt: Date;
}

const smsLogSchema = new Schema<ISmsLog>(
  {
    to: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["sent", "failed"], default: "sent" },
  },
  { timestamps: true }
);

export function getSmsLogModel(conn: Connection): Model<ISmsLog> {
  return (conn.models.SmsLog as Model<ISmsLog>) || conn.model<ISmsLog>("SmsLog", smsLogSchema);
}

export interface IPage extends Document {
  title: string;
  slug: string;
  content: string;
  status: "draft" | "published";
  showInNav: boolean;
  createdAt: Date;
}

const pageSchema = new Schema<IPage>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true },
    content: { type: String, default: "" },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    showInNav: { type: Boolean, default: false },
  },
  { timestamps: true }
);
pageSchema.index({ slug: 1 }, { unique: true });

export function getPageModel(conn: Connection): Model<IPage> {
  return (conn.models.Page as Model<IPage>) || conn.model<IPage>("Page", pageSchema);
}

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  content: string;
  coverImage?: string;
  status: "draft" | "published";
  createdAt: Date;
}

const blogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true },
    content: { type: String, default: "" },
    coverImage: String,
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true }
);
blogPostSchema.index({ slug: 1 }, { unique: true });

export function getBlogPostModel(conn: Connection): Model<IBlogPost> {
  return (conn.models.BlogPost as Model<IBlogPost>) || conn.model<IBlogPost>("BlogPost", blogPostSchema);
}
