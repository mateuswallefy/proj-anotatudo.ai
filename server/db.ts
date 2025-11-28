import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// NEON DATABASE URL - This is the ONLY source of truth for the database connection
// This overrides any Replit-managed PG* variables that might interfere
const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_TlZvP3kd2icV@ep-plain-art-acnjwa7b-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";

// Force clear any Replit PG* variables that might override our connection
// This ensures we ALWAYS connect to Neon, not Replit's managed database
delete process.env.PGHOST;
delete process.env.PGPORT;
delete process.env.PGUSER;
delete process.env.PGPASSWORD;
delete process.env.PGDATABASE;

// Use Neon URL directly - bypass any Replit environment interference
const databaseUrl = NEON_DATABASE_URL;

console.log(`[DB] Connecting to: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
