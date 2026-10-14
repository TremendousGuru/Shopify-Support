const { Pool } = require("pg");

const DATABASE_URL =
  "postgresql://postgres.rbdzzjoglzwiapxsogyb:Tr3m3nd0u2_7061@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    const tables = ["users", "customers", "agents", "tickets", "conversations", "messages", "serviceRequests", "stores"];
    for (const table of tables) {
      try {
        const res = await pool.query(`SELECT COUNT(*) AS cnt FROM "${table}"`);
        console.log(`${table}: ${JSON.stringify(res.rows[0])}`);
      } catch (e) {
        console.log(`${table}: ERROR ${e.message}`);
      }
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("UNCAUGHT ERROR:", e);
  process.exit(1);
});
