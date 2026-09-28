import { createHmac, timingSafeEqual } from "node:crypto";

function getSigningSecret() {
  const secret = process.env.AGENT_LINK_SECRET || process.env.AUTH_SECRET || process.env.DATABASE_URL;
  if (!secret) throw new Error("An agent link signing secret is required");
  return secret;
}

export function createAgentSignupToken(agentCode: string) {
  const payload = Buffer.from(JSON.stringify({ agentCode })).toString("base64url");
  const signature = createHmac("sha256", getSigningSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyAgentSignupToken(token: string): string | null {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;

  const expected = createHmac("sha256", getSigningSecret()).update(payload).digest();
  const supplied = Buffer.from(signature, "base64url");
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;

  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof value.agentCode === "string" && value.agentCode.trim()
      ? value.agentCode.trim().toUpperCase()
      : null;
  } catch {
    return null;
  }
}