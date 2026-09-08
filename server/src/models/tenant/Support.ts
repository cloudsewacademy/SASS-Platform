import { Schema, Connection, Model, Document } from "mongoose";

export interface IReview extends Document {
  productId: Schema.Types.ObjectId;
  customerName: string;
  rating: number;
  comment?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    customerName: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: String,
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

export function getReviewModel(conn: Connection): Model<IReview> {
  return (conn.models.Review as Model<IReview>) || conn.model<IReview>("Review", reviewSchema);
}

export interface ILead extends Document {
  name: string;
  phone: string;
  email?: string;
  source: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  notes?: string;
  createdAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    source: { type: String, default: "manual" },
    status: { type: String, enum: ["new", "contacted", "qualified", "converted", "lost"], default: "new" },
    notes: String,
  },
  { timestamps: true }
);

export function getLeadModel(conn: Connection): Model<ILead> {
  return (conn.models.Lead as Model<ILead>) || conn.model<ILead>("Lead", leadSchema);
}

export interface IIssue extends Document {
  subject: string;
  description: string;
  relatedOrderNumber?: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved" | "closed";
  createdAt: Date;
}

const issueSchema = new Schema<IIssue>(
  {
    subject: { type: String, required: true },
    description: { type: String, required: true },
    relatedOrderNumber: String,
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
  },
  { timestamps: true }
);

export function getIssueModel(conn: Connection): Model<IIssue> {
  return (conn.models.Issue as Model<IIssue>) || conn.model<IIssue>("Issue", issueSchema);
}
