import "dotenv/config";
import pg from "pg";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
await client.connect();

try {
  await client.query("BEGIN");
  await client.query(`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS external_ticket_reference TEXT`);
  await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS service_request_id UUID REFERENCES service_requests(id) ON DELETE SET NULL`);
  await client.query(`ALTER TABLE files ADD COLUMN IF NOT EXISTS storage_data BYTEA`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS service_proposals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      submitted_by_agent_id UUID NOT NULL REFERENCES agents(id),
      category_id UUID NOT NULL REFERENCES service_categories(id),
      name TEXT NOT NULL,
      short_description TEXT NOT NULL,
      full_description TEXT NOT NULL,
      starting_price INTEGER NOT NULL,
      estimated_days TEXT NOT NULL,
      features TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'pending',
      reviewed_by UUID REFERENCES users(id),
      review_note TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS service_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_code TEXT NOT NULL UNIQUE,
      service_request_id UUID NOT NULL UNIQUE REFERENCES service_requests(id) ON DELETE CASCADE,
      customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      service_id UUID NOT NULL REFERENCES services(id),
      assigned_agent_id UUID REFERENCES agents(id),
      service_name TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'Awaiting Payment',
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      payment_reported_at TIMESTAMP,
      payment_confirmed_at TIMESTAMP,
      payment_confirmed_by UUID REFERENCES users(id),
      work_started_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `);
  await client.query("COMMIT");
  console.log("Support schema is ready (message links, file byte storage, service proposals, and service orders).");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
