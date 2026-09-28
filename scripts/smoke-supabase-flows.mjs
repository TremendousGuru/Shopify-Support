import "dotenv/config";
import crypto from "node:crypto";
import { Client } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const baseUrl = process.env.SMOKE_TEST_BASE_URL || "http://localhost:3000";
const runId = crypto.randomUUID();
const agentEmail = `smoke-agent-${runId}@example.invalid`;
const customerEmail = `smoke-customer-${runId}@example.invalid`;
const customerPassword = `Test-${crypto.randomBytes(18).toString("hex")}`;
const agentCode = `SHOP-AGENT-SMOKE-${runId.slice(0, 8).toUpperCase()}`;
const passwordSalt = crypto.randomBytes(16).toString("hex");
const passwordHash = crypto.pbkdf2Sync("TemporaryAgentOnly", passwordSalt, 10000, 64, "sha512").toString("hex");
const secret = process.env.AGENT_LINK_SECRET || process.env.AUTH_SECRET || process.env.DATABASE_URL;
const tokenPayload = Buffer.from(JSON.stringify({ agentCode })).toString("base64url");
const tokenSignature = crypto.createHmac("sha256", secret).update(tokenPayload).digest("base64url");
const agentToken = `${tokenPayload}.${tokenSignature}`;

const db = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15000,
});

let agentUserId;
let customerUserId;
let customerId;
let connected = false;

async function postJson(path, body, headers = {}) {
  return fetch(new URL(path, baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

try {
  await db.connect();
  connected = true;
  const agentInsert = await db.query(
    `INSERT INTO users (email, password_hash, role, full_name, is_active, is_email_verified)
     VALUES ($1, $2, 'agent', 'Temporary Supabase Smoke Agent', true, true)
     RETURNING id`,
    [agentEmail, `${passwordSalt}:${passwordHash}`]
  );
  agentUserId = agentInsert.rows[0].id;
  await db.query(
    `INSERT INTO agents (user_id, agent_code, status)
     VALUES ($1, $2, 'Available')`,
    [agentUserId, agentCode]
  );

  const signupResponse = await postJson("/api/auth/customer-onboarding", {
    email: customerEmail,
    password: customerPassword,
    fullName: "Temporary Supabase Smoke Customer",
    businessName: "Temporary Smoke Store",
    storeName: "Temporary Smoke Store",
    storeUrl: "https://supabase-smoke.example.invalid",
    storeCategory: "Retail",
    businessStage: "Early Stage",
    primaryGoals: "Temporary signup and ticket smoke test",
    termsAccepted: true,
    privacyPolicyAccepted: true,
    supportPolicyAccepted: true,
    marketingConsent: false,
    agentToken,
  });
  const signupData = await signupResponse.json();
  if (!signupResponse.ok) throw new Error(`Signup failed with HTTP ${signupResponse.status}: ${signupData.error || "unknown error"}`);
  customerUserId = signupData.user.id;
  customerId = signupData.customer.id;
  console.log("Customer signup: passed");

  const loginResponse = await postJson("/api/auth/login", {
    email: customerEmail,
    password: customerPassword,
  });
  const loginData = await loginResponse.json();
  if (!loginResponse.ok) throw new Error(`Customer login failed with HTTP ${loginResponse.status}`);
  console.log("Customer login: passed");

  const setCookies = loginResponse.headers.getSetCookie?.() || [];
  const sessionCookie = setCookies
    .map((value) => value.split(";")[0])
    .find((value) => value.startsWith("shop_support_session="));
  if (!sessionCookie) throw new Error("Customer login did not return a session cookie");

  const ticketResponse = await postJson("/api/tickets", {
    subject: "Temporary Supabase smoke-test ticket",
    description: "This ticket is created only to verify the Supabase API and is removed by the test.",
    category: "Shopify Store Support",
  }, { cookie: sessionCookie });
  const ticketData = await ticketResponse.json();
  if (!ticketResponse.ok) throw new Error(`Ticket creation failed with HTTP ${ticketResponse.status}: ${ticketData.error || "unknown error"}`);
  console.log("Ticket creation: passed");
} finally {
  if (connected) {
    await db.query("BEGIN");
    try {
      const smokeCustomers = await db.query(
        `SELECT c.id
         FROM customers c
         INNER JOIN users u ON u.id = c.user_id
         WHERE u.email LIKE $1`,
        ["smoke-customer-%@example.invalid"]
      );
      const customerIds = smokeCustomers.rows.map((row) => row.id);
      if (customerIds.length) {
        await db.query("DELETE FROM conversations WHERE customer_id = ANY($1::uuid[])", [customerIds]);
        await db.query("DELETE FROM tickets WHERE customer_id = ANY($1::uuid[])", [customerIds]);
        await db.query("DELETE FROM stores WHERE customer_id = ANY($1::uuid[])", [customerIds]);
      }
      const deletedCustomers = await db.query(
        "DELETE FROM users WHERE email LIKE $1 RETURNING id",
        ["smoke-customer-%@example.invalid"]
      );
      const deletedAgents = await db.query(
        "DELETE FROM users WHERE email LIKE $1 RETURNING id",
        ["smoke-agent-%@example.invalid"]
      );
      await db.query("COMMIT");
      const removedCount = deletedCustomers.rowCount + deletedAgents.rowCount;
      console.log(`Temporary test records: cleaned up (${removedCount} test users)`);
    } catch (error) {
      await db.query("ROLLBACK");
      console.error("Temporary test cleanup failed; inspect Supabase for smoke-test records.");
      throw error;
    } finally {
      await db.end();
    }
  }
}