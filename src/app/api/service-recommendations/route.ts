import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { conversations, customers, messages, serviceRequests, services } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { sendNotification } from "@/lib/notifications";
import { canAgentAccessConversation } from "@/lib/conversation-access";

const QUOTE_VALIDITY_DAYS = 30;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "agent" || !user.agent) {
      return NextResponse.json({ error: "Agent access required" }, { status: 403 });
    }

    const body = await request.json();
    const { conversationId, serviceId, description, quotePrice, quoteTimeline, quoteTerms } = body;
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
    if (!conversation || !(await canAgentAccessConversation(user.agent.id, conversation))) {
      return NextResponse.json({ error: "Access denied to this conversation" }, { status: 403 });
    }
    const [service] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
    if (!service || !service.isActive) {
      return NextResponse.json({ error: "Choose an active catalog service" }, { status: 400 });
    }

    const amount = quotePrice === undefined || quotePrice === "" ? Number(service.startingPrice ?? 0) : Number(quotePrice);
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 2_147_483_647) {
      return NextResponse.json({ error: "Quote amount must be a positive whole number" }, { status: 400 });
    }
    if (
      (description !== undefined && (typeof description !== "string" || description.length > 4000)) ||
      (quoteTimeline !== undefined && (typeof quoteTimeline !== "string" || quoteTimeline.length > 120)) ||
      (quoteTerms !== undefined && (typeof quoteTerms !== "string" || quoteTerms.length > 4000))
    ) {
      return NextResponse.json({ error: "Description, timeline, or quote terms exceed the allowed length" }, { status: 400 });
    }
    const requestCode = `REQ-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const requestDescription = typeof description === "string" && description.trim()
      ? description.trim()
      : service.fullDescription || service.shortDescription || service.name;

    const [created] = await db.transaction(async (tx) => {
      const [serviceRequest] = await tx.insert(serviceRequests).values({
        requestCode,
        customerId: conversation.customerId,
        serviceId: service.id,
        status: "Quoted",
        description: requestDescription,
        desiredTimeframe: quoteTimeline || service.estimatedDays || "Standard",
        assignedAgentId: user.agent!.id,
        quotePrice: amount,
        quoteTimeline: quoteTimeline || service.estimatedDays || "To be confirmed",
        quoteTerms: typeof quoteTerms === "string" && quoteTerms.trim()
          ? quoteTerms.trim()
          : "Work begins after payment is reported and confirmed by your assigned agent.",
        quoteStatus: "Sent",
        quoteExpiresAt: new Date(Date.now() + QUOTE_VALIDITY_DAYS * 24 * 60 * 60 * 1000),
      }).returning();

      const [message] = await tx.insert(messages).values({
        conversationId: conversation.id,
        serviceRequestId: serviceRequest.id,
        senderId: user.id,
        senderRole: user.role,
        senderName: user.fullName,
        content: `Service recommendation: ${service.name}. ${requestDescription}`,
        isInternalNote: false,
        isRead: false,
      }).returning();
      await tx.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conversation.id));
      return [{ serviceRequest, message }];
    });

    const [customer] = await db.select({ userId: customers.userId }).from(customers).where(eq(customers.id, conversation.customerId)).limit(1);
    if (customer) await sendNotification({ userId: customer.userId, type: "QUOTE_AVAILABLE", title: `Service recommendation: ${service.name}`, body: `Review the ${amount} USD quote and approve to place your order.`, link: `/customer/messages?conversationId=${conversation.id}` });

    return NextResponse.json({ success: true, ...created });
  } catch (error) {
    console.error("Error creating service recommendation:", error);
    return NextResponse.json({ error: "Failed to send recommendation" }, { status: 500 });
  }
}
