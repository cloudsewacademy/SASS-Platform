import { Schema, Connection, Model, Document } from "mongoose";

export interface IFormField {
  label: string;
  type: "text" | "email" | "phone" | "textarea" | "select";
  required: boolean;
  options?: string[]; // for type: "select"
}

export interface ICustomForm extends Document {
  title: string;
  slug: string;
  description?: string;
  fields: IFormField[];
  successMessage: string;
  createLead: boolean; // if true, each submission also creates a Lead record
  createdAt: Date;
}

const formFieldSchema = new Schema<IFormField>(
  {
    label: { type: String, required: true },
    type: { type: String, enum: ["text", "email", "phone", "textarea", "select"], default: "text" },
    required: { type: Boolean, default: false },
    options: [String],
  },
  { _id: false }
);

const customFormSchema = new Schema<ICustomForm>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true },
    description: String,
    fields: { type: [formFieldSchema], default: [] },
    successMessage: { type: String, default: "Thanks — we'll get back to you soon." },
    createLead: { type: Boolean, default: false },
  },
  { timestamps: true }
);
customFormSchema.index({ slug: 1 }, { unique: true });

export function getCustomFormModel(conn: Connection): Model<ICustomForm> {
  return (conn.models.CustomForm as Model<ICustomForm>) || conn.model<ICustomForm>("CustomForm", customFormSchema);
}

export interface IFormSubmission extends Document {
  formId: Schema.Types.ObjectId;
  values: Record<string, string>;
  createdAt: Date;
}

const formSubmissionSchema = new Schema<IFormSubmission>(
  {
    formId: { type: Schema.Types.ObjectId, ref: "CustomForm", required: true },
    values: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export function getFormSubmissionModel(conn: Connection): Model<IFormSubmission> {
  return (
    (conn.models.FormSubmission as Model<IFormSubmission>) ||
    conn.model<IFormSubmission>("FormSubmission", formSubmissionSchema)
  );
}
