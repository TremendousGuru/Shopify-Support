import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import webpush from "web-push";

const envPath = resolve(process.cwd(), ".env");
const rotateKeys = process.argv.includes("--rotate");
if (!existsSync(envPath)) {
  throw new Error("Create .env from .env.example before setting up device notifications.");
}

const original = readFileSync(envPath, "utf8");
const newline = original.includes("\r\n") ? "\r\n" : "\n";
const lines = original.split(/\r?\n/);
const values = new Map();

for (const line of lines) {
  const match = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
  if (match) values.set(match[1], match[2]);
}

const hasPublicKey = Boolean(values.get("VAPID_PUBLIC_KEY"));
const hasPrivateKey = Boolean(values.get("VAPID_PRIVATE_KEY"));
if (hasPublicKey !== hasPrivateKey) {
  throw new Error("VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be configured together.");
}

const generatedKeys = rotateKeys || !hasPublicKey ? webpush.generateVAPIDKeys() : null;
const settings = {
  VAPID_PUBLIC_KEY: generatedKeys?.publicKey || values.get("VAPID_PUBLIC_KEY"),
  VAPID_PRIVATE_KEY: generatedKeys?.privateKey || values.get("VAPID_PRIVATE_KEY"),
  VAPID_SUBJECT: values.get("VAPID_SUBJECT") || "mailto:admin@example.com",
};

const updated = new Set();
const output = lines.map((line) => {
  const match = line.match(/^\s*([A-Z0-9_]+)=/);
  if (!match || !(match[1] in settings)) return line;
  updated.add(match[1]);
  return `${match[1]}=${settings[match[1]]}`;
});

for (const [name, value] of Object.entries(settings)) {
  if (!updated.has(name)) output.push(`${name}=${value}`);
}

writeFileSync(envPath, output.join(newline), "utf8", { mode: 0o600 });
console.log(`${rotateKeys ? "VAPID keys rotated" : "Device push settings configured"} in .env. Secret values were not printed.`);
