import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import authRoutes from "./routes/auth";
import orderRoutes from "./routes/orders";
import inventoryRoutes from "./routes/inventory";
import productRoutes from "./routes/products";
import adminRoutes from "./routes/admin";
import categoryRoutes from "./routes/categories";
import brandRoutes from "./routes/brands";
import leadRoutes from "./routes/leads";
import issueRoutes from "./routes/issues";
import reviewRoutes from "./routes/reviews";
import couponRoutes from "./routes/coupons";
import customerRoutes from "./routes/customers";
import pageRoutes from "./routes/pages";
import blogRoutes from "./routes/blog";
import settingsRoutes from "./routes/settings";
import mediaRoutes from "./routes/media";
import smsRoutes from "./routes/sms";
import analyticsRoutes from "./routes/analytics";
import financeRoutes from "./routes/finance";
import storeUserRoutes from "./routes/storeUsers";
import formRoutes from "./routes/forms";
import publicRoutes from "./routes/public";
import platformSettingsRoutes from "./routes/platformSettings";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: [process.env.CLIENT_DASHBOARD_ORIGIN, process.env.CLIENT_STOREFRONT_ORIGIN].filter(
        Boolean
      ) as string[],
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(morgan("dev"));

  // Uploaded media (product images, brand logos, blog covers, ...), served
  // directly by Express. Fine for local/dev; swap for S3/Cloudinary + a
  // CDN in front for production scale.
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/brands", brandRoutes);
  app.use("/api/leads", leadRoutes);
  app.use("/api/issues", issueRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/coupons", couponRoutes);
  app.use("/api/customers", customerRoutes);
  app.use("/api/pages", pageRoutes);
  app.use("/api/blog", blogRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/media", mediaRoutes);
  app.use("/api/sms", smsRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/finance", financeRoutes);
  app.use("/api/store-users", storeUserRoutes);
  app.use("/api/forms", formRoutes);
  app.use("/api/public", publicRoutes);
  app.use("/api/platform-settings", platformSettingsRoutes);

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || "Internal server error" });
  });

  return app;
}
