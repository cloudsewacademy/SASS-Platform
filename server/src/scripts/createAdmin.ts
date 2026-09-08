import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import { connectMasterDb } from "../config/masterDb";
import { PlatformAdmin } from "../models/master/PlatformAdmin";

/**
 * Creates a platform-admin account. Run this directly on the server:
 *
 *   npx ts-node src/scripts/createAdmin.ts "Jane Doe" jane@company.com "a-strong-password"
 *
 * There is intentionally no HTTP route to self-register an admin account —
 * doing it this way means creating an admin always requires shell access
 * to the box, not just knowledge of an API endpoint.
 */
async function main() {
  const [, , name, email, password] = process.argv;
  if (!name || !email || !password) {
    console.error('Usage: ts-node src/scripts/createAdmin.ts "Name" "email@x.com" "password"');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters");
    process.exit(1);
  }

  await connectMasterDb();

  const existing = await PlatformAdmin.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.error(`An admin with email ${email} already exists`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await PlatformAdmin.create({ name, email: email.toLowerCase(), passwordHash });

  console.log(`Created platform admin: ${admin.email} (${admin._id})`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
