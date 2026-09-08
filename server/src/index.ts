import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";
import { connectMasterDb } from "./config/masterDb";

async function main() {
  await connectMasterDb();
  const app = createApp();
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`[server] listening on :${port}`));
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
