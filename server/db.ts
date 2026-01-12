import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Force clear any PG* variables that might override our connection
// This ensures we ALWAYS connect to Neon
delete process.env.PGHOST;
delete process.env.PGPORT;
delete process.env.PGUSER;
delete process.env.PGPASSWORD;
delete process.env.PGDATABASE;

// Use NEON_DATABASE_URL (preferred)
// Fallback to DATABASE_URL for compatibility
const getDatabaseUrl = () => {
  const databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "NEON_DATABASE_URL or DATABASE_URL must be set. Check your .env.local file in development.",
    );
  }
  return databaseUrl;
};

// Lazy initialization - no connection until initializeDatabaseAsync is called
export let pool: Pool | null = null;
export let db: ReturnType<typeof drizzle> | null = null;

export async function initializeDatabaseAsync() {
  if (!db) {
    const databaseUrl = getDatabaseUrl();
    console.log(`[DB] Connecting to: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);
    
    pool = new Pool({ connectionString: databaseUrl });
    db = drizzle({ client: pool, schema });
    
    console.log(`[DB] Database connection initialized`);
  }
}

/**
 * Ping the database to check connectivity and measure latency
 * Returns { ok: boolean, latencyMs?: number, error?: string }
 */
export async function pingDatabase(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  try {
    if (!db) {
      // Try to initialize if not already done
      await initializeDatabaseAsync();
    }

    if (!db) {
      return { ok: false, error: "Database not initialized" };
    }

    const startTime = Date.now();
    await db.execute(sql`SELECT 1`);
    const latencyMs = Date.now() - startTime;

    return { ok: true, latencyMs };
  } catch (error: any) {
    return {
      ok: false,
      error: error.message || "Unknown database error",
    };
  }
}

/**
 * Extract hostname from database URL (without credentials)
 */
export function getDatabaseHostname(): string | null {
  try {
    const databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
    if (!databaseUrl) {
      return null;
    }
    const url = new URL(databaseUrl);
    return url.hostname;
  } catch {
    return null;
  }
}
