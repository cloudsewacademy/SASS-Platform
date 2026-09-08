import mongoose, { Connection } from "mongoose";

/**
 * Separate-database-per-tenant connection manager.
 *
 * Design:
 *  - Each tenant gets its own physical MongoDB database (strong isolation:
 *    a bug or query leak in one tenant's data access can never touch
 *    another tenant's collection).
 *  - We do NOT open a new connection per request. Connections are opened
 *    lazily on first use and cached in-process (a simple connection pool
 *    keyed by tenant dbName). Mongoose's own connection already pools
 *    sockets underneath, so this is a pool-of-pools.
 *  - An LRU-ish cap + idle-timeout eviction keeps this safe at scale
 *    instead of accumulating one open connection per tenant forever.
 */

const MAX_CACHED_CONNECTIONS = 50;
const IDLE_EVICT_MS = 30 * 60 * 1000; // 30 min

interface CachedConn {
  conn: Connection;
  lastUsed: number;
}

const connectionCache = new Map<string, CachedConn>();

function fullUri(dbName: string): string {
  const base = process.env.TENANT_MONGODB_BASE_URI;
  const prefix = process.env.TENANT_DB_PREFIX ?? "tenant_";
  if (!base) throw new Error("TENANT_MONGODB_BASE_URI is not set");
  // base like "mongodb://127.0.0.1:27017/" -> append db name
  return `${base.replace(/\/$/, "")}/${prefix}${dbName}`;
}

async function evictIdleConnections() {
  const now = Date.now();
  for (const [key, cached] of connectionCache.entries()) {
    if (now - cached.lastUsed > IDLE_EVICT_MS) {
      await cached.conn.close().catch(() => {});
      connectionCache.delete(key);
      console.log(`[tenant-db] evicted idle connection -> ${key}`);
    }
  }
}

async function evictOldestIfOverCap() {
  if (connectionCache.size < MAX_CACHED_CONNECTIONS) return;
  let oldestKey: string | null = null;
  let oldestTime = Infinity;
  for (const [key, cached] of connectionCache.entries()) {
    if (cached.lastUsed < oldestTime) {
      oldestTime = cached.lastUsed;
      oldestKey = key;
    }
  }
  if (oldestKey) {
    const cached = connectionCache.get(oldestKey);
    await cached?.conn.close().catch(() => {});
    connectionCache.delete(oldestKey);
    console.log(`[tenant-db] evicted (cap reached) -> ${oldestKey}`);
  }
}

/**
 * Get (or lazily open) the mongoose Connection for a given tenant dbName.
 * Pass the tenant's `dbName` field (from the master Tenant record), NOT
 * the tenant's public slug — those can diverge if a store renames itself.
 */
export async function getTenantConnection(dbName: string): Promise<Connection> {
  if (!dbName) throw new Error("getTenantConnection: dbName is required");

  const cached = connectionCache.get(dbName);
  if (cached && cached.conn.readyState === 1) {
    cached.lastUsed = Date.now();
    return cached.conn;
  }

  await evictIdleConnections();
  await evictOldestIfOverCap();

  const conn = mongoose.createConnection(fullUri(dbName), {
    maxPoolSize: 10,
  });

  await new Promise<void>((resolve, reject) => {
    conn.once("open", () => resolve());
    conn.once("error", reject);
  });

  connectionCache.set(dbName, { conn, lastUsed: Date.now() });
  console.log(`[tenant-db] connected -> ${dbName}`);
  return conn;
}

export async function closeAllTenantConnections(): Promise<void> {
  await Promise.all(
    Array.from(connectionCache.values()).map((c) => c.conn.close().catch(() => {}))
  );
  connectionCache.clear();
}
