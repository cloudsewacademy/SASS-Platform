import { Schema, Connection, Model, Document } from "mongoose";

export interface ISettings extends Document {
  storeDetails: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  payments: {
    codEnabled: boolean;
    esewaEnabled: boolean;
    esewaMerchantCode?: string;
    khaltiEnabled: boolean;
    khaltiPublicKey?: string;
    khaltiSecretKey?: string;
    fonepayEnabled: boolean;
    fonepayMerchantCode?: string;
    fonepaySecretKey?: string;
    codMaxAmount?: number;
  };
  socialLinks: { platform: string; url: string }[];
  appearance: {
    primaryColor: string;
    logoUrl?: string;
    faviconUrl?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    heroImageUrl?: string;
    productGridStyle: "grid" | "list";
    themePreset: string;
    fontFamily: string;
    borderRadius: "sharp" | "rounded" | "pill";
  };
  header: {
    announcementText?: string;
    showSearch: boolean;
    layout: "standard" | "centered";
  };
  navigation: {
    links: { label: string; type: "page" | "custom"; target: string }[];
  };
  footer: {
    columns: { title: string; links: { label: string; url: string }[] }[];
    copyrightText?: string;
    showPoweredBy: boolean;
    layout: "columns" | "simple";
  };
  homepageSections: {
    id: string;
    type: "hero" | "featured_products" | "categories_showcase" | "banner" | "testimonials" | "custom_html";
    enabled: boolean;
    config: Record<string, any>;
  }[];
  plugins: Record<string, boolean>;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    storeDetails: {
      name: { type: String, default: "" },
      address: String,
      phone: String,
      email: String,
    },
    payments: {
      codEnabled: { type: Boolean, default: true },
      esewaEnabled: { type: Boolean, default: false },
      esewaMerchantCode: String,
      khaltiEnabled: { type: Boolean, default: false },
      khaltiPublicKey: String,
      khaltiSecretKey: String,
      fonepayEnabled: { type: Boolean, default: false },
      fonepayMerchantCode: String,
      fonepaySecretKey: String,
      codMaxAmount: Number,
    },
    socialLinks: [{ platform: String, url: String }],
    appearance: {
      primaryColor: { type: String, default: "#7c3aed" },
      logoUrl: String,
      faviconUrl: String,
      heroTitle: String,
      heroSubtitle: String,
      heroImageUrl: String,
      productGridStyle: { type: String, enum: ["grid", "list"], default: "grid" },
      themePreset: { type: String, default: "violet" },
      fontFamily: { type: String, default: "system" },
      borderRadius: { type: String, enum: ["sharp", "rounded", "pill"], default: "rounded" },
    },
    header: {
      announcementText: String,
      showSearch: { type: Boolean, default: true },
      layout: { type: String, enum: ["standard", "centered"], default: "standard" },
    },
    navigation: {
      links: [
        {
          label: { type: String, required: true },
          type: { type: String, enum: ["page", "custom"], default: "custom" },
          target: { type: String, required: true },
        },
      ],
    },
    footer: {
      columns: [
        {
          title: String,
          links: [{ label: String, url: String }],
        },
      ],
      copyrightText: String,
      showPoweredBy: { type: Boolean, default: true },
      layout: { type: String, enum: ["columns", "simple"], default: "columns" },
    },
    homepageSections: [
      {
        id: { type: String, required: true },
        type: {
          type: String,
          enum: ["hero", "featured_products", "categories_showcase", "banner", "testimonials", "custom_html"],
          required: true,
        },
        enabled: { type: Boolean, default: true },
        config: { type: Schema.Types.Mixed, default: {} },
      },
    ],
    plugins: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export function getSettingsModel(conn: Connection): Model<ISettings> {
  return (conn.models.Settings as Model<ISettings>) || conn.model<ISettings>("Settings", settingsSchema);
}

/** There is exactly one Settings document per tenant; create it on first read. */
export async function getOrCreateSettings(conn: Connection) {
  const Settings = getSettingsModel(conn);
  let doc = await Settings.findOne();
  if (!doc) {
    doc = await Settings.create({
      homepageSections: [
        { id: "hero-1", type: "hero", enabled: true, config: {} },
        { id: "featured-1", type: "featured_products", enabled: true, config: { title: "Featured products", limit: 8 } },
      ],
    });
  }
  return doc;
}
