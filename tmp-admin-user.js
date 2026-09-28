require('dotenv').config({ path: '.env' });
const crypto = require('crypto');
const { Client } = require('pg');

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const fullName = process.env.ADMIN_FULL_NAME?.trim();

if (!email || !password || !fullName) {
  throw new Error('ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_FULL_NAME are required');
}
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
const passwordHash = `${salt}:${hash}`;

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rowCount > 0) {
    await client.query(
      `UPDATE users
       SET password_hash = $1,
           full_name = $2,
           role = 'system_admin',
           is_active = true,
           is_email_verified = true,
           updated_at = NOW()
       WHERE email = $3`,
      [passwordHash, fullName, email]
    );
  } else {
    await client.query(
      `INSERT INTO users (email, password_hash, role, full_name, is_active, is_email_verified, created_at, updated_at)
       VALUES ($1, $2, 'system_admin', $3, true, true, NOW(), NOW())`,
      [email, passwordHash, fullName]
    );
  }

  const result = await client.query(
    'SELECT email, full_name, role, is_active FROM users WHERE email = $1',
    [email]
  );

  console.log(JSON.stringify(result.rows[0], null, 2));
  await client.end();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
