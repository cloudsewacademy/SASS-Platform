import mongoose from "mongoose";

let masterConnection: typeof mongoose | null = null;

/**
 * The "master" / control-plane database.
 * Holds platform-level data that is NOT tenant-specific:
 *   - Tenant registry (store name, dbName, plan, status, owner)
 *   - Platform users (who can log in, which tenant(s) they belong to)
 *   - Billing / subscription records
 *
 * Every tenant's actual store data (products, orders, customers) lives in
 * its OWN separate database — see tenantDb.ts.
 */
export async function connectMasterDb(): Promise<typeof mongoose> {
  if (masterConnection) return masterConnection;

  const uri = process.env.MASTER_MONGODB_URI;
  if (!uri) throw new Error("MASTER_MONGODB_URI is not set");

  await mongoose.connect(uri);
  masterConnection = mongoose;
  console.log(`[master-db] connected -> ${uri}`);
  return masterConnection;
}
