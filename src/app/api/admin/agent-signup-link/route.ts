import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { agents, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { createAgentSignupToken } from "@/lib/agent-links";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !["system_admin", "support_supervisor"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { agentId } = await request.json();
  if (!agentId) {
    return NextResponse.json({ error: "Agent ID is required" }, { status: 400 });
  }

  const [agent] = await db
    .select({ id: agents.id, agentCode: agents.agentCode, status: agents.status })
    .from(agents)
    .innerJoin(users, eq(users.id, agents.userId))
    .where(and(eq(agents.id, agentId), eq(users.isActive, true)))
    .limit(1);

  if (!agent || agent.status === "Terminated") {
    return NextResponse.json({ error: "Active agent not found" }, { status: 404 });
  }

  const token = createAgentSignupToken(agent.agentCode);
  return NextResponse.json({ path: `/start/customer?agentToken=${encodeURIComponent(token)}` });
}