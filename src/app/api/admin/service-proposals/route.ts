import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { agents, serviceCategories, serviceProposals, services, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "system_admin") {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const proposals = await db.select().from(serviceProposals).orderBy(asc(serviceProposals.status), asc(serviceProposals.createdAt));
  const enriched = await Promise.all(proposals.map(async (proposal) => {
    const [category] = await db.select({ name: serviceCategories.name }).from(serviceCategories).where(eq(serviceCategories.id, proposal.categoryId)).limit(1);
    const [agent] = await db.select({ userId: agents.userId, agentCode: agents.agentCode }).from(agents).where(eq(agents.id, proposal.submittedByAgentId)).limit(1);
    const [agentUser] = agent ? await db.select({ fullName: users.fullName }).from(users).where(eq(users.id, agent.userId)).limit(1) : [];
    return { ...proposal, categoryName: category?.name, agentName: agentUser?.fullName, agentCode: agent?.agentCode };
  }));
  return NextResponse.json({ proposals: enriched });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "system_admin") {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const body = await request.json();
  const { proposalId, decision, reviewNote } = body;
  if (!proposalId || !["approve", "reject"].includes(decision)) {
    return NextResponse.json({ error: "Proposal and valid decision are required" }, { status: 400 });
  }

  const [proposal] = await db.select().from(serviceProposals).where(eq(serviceProposals.id, proposalId)).limit(1);
  if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  if (proposal.status !== "pending") return NextResponse.json({ error: "Proposal has already been reviewed" }, { status: 409 });

  try {
    const updated = await db.transaction(async (tx) => {
      let publishedService = null;
      if (decision === "approve") {
        const baseSlug = proposal.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "shopify-service";
        const slug = `${baseSlug}-${proposal.id.slice(0, 8)}`;
        [publishedService] = await tx.insert(services).values({
          categoryId: proposal.categoryId,
          slug,
          name: proposal.name,
          shortDescription: proposal.shortDescription,
          fullDescription: proposal.fullDescription,
          startingPrice: proposal.startingPrice,
          estimatedDays: proposal.estimatedDays,
          features: proposal.features,
          isActive: true,
          displayOrder: 999,
        }).returning();
      }
      const [reviewed] = await tx.update(serviceProposals).set({
        status: decision === "approve" ? "approved" : "rejected",
        reviewedBy: user.id,
        reviewNote: typeof reviewNote === "string" ? reviewNote.trim() || null : null,
        updatedAt: new Date(),
      }).where(and(eq(serviceProposals.id, proposalId), eq(serviceProposals.status, "pending"))).returning();
      if (!reviewed) throw new Error("Proposal has already been reviewed");
      return { proposal: reviewed, service: publishedService };
    });
    return NextResponse.json({ success: true, ...updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Proposal has already been reviewed") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Error reviewing service proposal:", error);
    return NextResponse.json({ error: "Failed to review proposal" }, { status: 500 });
  }
}