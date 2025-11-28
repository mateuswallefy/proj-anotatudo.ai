import { storage } from "../server/storage.js";

async function main() {
  const result = await storage.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_type = 'BASE TABLE'
     ORDER BY table_name`
  );

  console.log("Tabelas encontradas:");
  for (const row of result.rows) {
    console.log("-", row.table_name);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
