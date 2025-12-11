import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL && !process.env.NEON_DATABASE_URL) {
  throw new Error("DATABASE_URL or NEON_DATABASE_URL must be set");
}

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  migrations: {
    table: "__drizzle_migrations",
    schema: "./migrations",
  },
  dbCredentials: {
    url: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || "",
  },
});
