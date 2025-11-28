import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Force clear any Replit PG* variables that might override our connection
// This ensures we ALWAYS connect to Neon, not Replit's managed database
delete process.env.PGHOST;
delete process.env.PGPORT;
delete process.env.PGUSER;
delete process.env.PGPASSWORD;
delete process.env.PGDATABASE;

// Use NEON_DATABASE_URL (custom name that Replit won't override)
// Fallback to DATABASE_URL for compatibility
const databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "NEON_DATABASE_URL must be set. Add it in Replit Secrets.",
  );
}

console.log(`[DB] Connecting to: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
