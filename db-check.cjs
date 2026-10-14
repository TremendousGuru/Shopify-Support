const { Pool } = require("pg");

(async () => {
  const pool = new Pool({
    connectionString: "postgresql://postgres.rbdzzjoglzwiapxsogyb:Tr3m3nd0u2_7061@aws-1-eu-west-1.pooler.supabase.com:6543/postgres",
  });

  try {
    const res = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log("TABLES:", JSON.stringify(res.rows.map((r) => r.table_name)));
  } catch (e) {
    console.error("ERROR:", e.message);
  } finally {
    await pool.end();
  }
})();

async function checkStores() {
  const DATABASE_URL =
    "postgresql://postgres.rbdzzjoglzwiapxsogyb:Tr3m3nd0u2_7061@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";
  const pool2 = new Pool({ connectionString: DATABASE_URL });

  try {
    const tablesRes = await pool2.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log("\nALL TABLES:", JSON.stringify(tablesRes.rows.map((r) => r.table_name)));

    const storesCols = await pool2.query(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'stores'
       ORDER BY ordinal_position`
    );
    console.log("\nSTORES COLUMNS:", JSON.stringify(
      storesCols.rows.map((r) => ({ column: r.column_name, type: r.data_type, nullable: r.is_nullable, default: r.column_default }))
    ));
  } catch (e) {
    console.error("ERROR:", e.message);
  } finally {
    await pool2.end();
  }
}

checkStores();


checkStores();
