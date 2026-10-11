import { NextResponse } from "next/server";
import { db } from "@/db";
import { messages, conversations, customers, users, agents, files, services, serviceRequests } from "@/db/schema";
import { eq, asc, desc, and, inArray, ne } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { sendNotification } from "@/lib/notifications";
import { canAgentAccessConversation } from "@/lib/conversation-access";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
    }

    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // PRIVACY ENFORCEMENT:
    // 1. Customer: Must be the owner
    if (user.role === "customer") {
      if (conv.customerId !== user.customer?.id) {
        return NextResponse.json({ error: "Access denied to this conversation" }, { status: 403 });
      }
    }
    if (user.role === "agent" && (!user.agent || !(await canAgentAccessConversation(user.agent.id, conv)))) {
      return NextResponse.json({ error: "Access denied to this conversation" }, { status: 403 });
    }

    await db.update(messages).set({ isRead: true }).where(and(
      eq(messages.conversationId, conversationId),
      ne(messages.senderId, user.id),
      eq(messages.isRead, false),
      ...(user.role === "customer" ? [eq(messages.isInternalNote, false)] : [])
    ));

    // 2. Query messages
    // Note: If customer, exclude internal notes
    let msgs: any[] = [];
    if (user.role === "customer") {
      msgs = await db
        .select()
        .from(messages)
        .where(and(eq(messages.conversationId, conversationId), eq(messages.isInternalNote, false)))
        .orderBy(asc(messages.createdAt));
    } else {
      // Agents & Admins can see internal notes if marked
      msgs = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(asc(messages.createdAt));
    }

    const enrichedMessages = await Promise.all(msgs.map(async (message) => {
      if (!message.serviceRequestId) return message;
      const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, message.serviceRequestId)).limit(1);
      if (!request) return message;
      const [service] = await db.select({ name: services.name }).from(services).where(eq(services.id, request.serviceId)).limit(1);
      return {
        ...message,
        serviceRecommendation: {
          requestId: request.id,
          requestCode: request.requestCode,
          serviceName: service?.name,
          quotePrice: request.quotePrice,
          quoteTimeline: request.quoteTimeline,
          quoteTerms: request.quoteTerms,
          quoteStatus: request.quoteStatus,
          quoteBillingInterval: request.quoteBillingInterval,
          quoteExpiresAt: request.quoteExpiresAt,
          quoteExpired: !!request.quoteExpiresAt && request.quoteExpiresAt <= new Date(),
        },
      };
    }));

    return NextResponse.json({
      conversation: conv,
      messages: enrichedMessages,
    });
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, content, attachments, isInternalNote = false } = body;
    const trimmedContent = typeof content === "string" ? content.trim() : "";
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    if (!conversationId || (!trimmedContent && !hasAttachments) || (attachments !== undefined && !Array.isArray(attachments))) {
      return NextResponse.json({ error: "Conversation ID and message text or attachments are required" }, { status: 400 });
    }

    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Privacy check
    if (user.role === "customer") {
      if (conv.customerId !== user.customer?.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
      if (isInternalNote) {
        return NextResponse.json({ error: "Customers cannot create internal notes" }, { status: 403 });
      }
    }
    if (user.role === "agent" && (!user.agent || !(await canAgentAccessConversation(user.agent.id, conv)))) {
      return NextResponse.json({ error: "Access denied to this conversation" }, { status: 403 });
    }

    let safeAttachments: Array<{ id: string; fileName: string; fileType: string; fileSize: number; fileUrl: string }> = [];
    if (hasAttachments) {
      const attachmentIds = attachments.map((attachment: any) => attachment?.id);
      if (attachmentIds.some((id: unknown) => typeof id !== "string") || new Set(attachmentIds).size !== attachmentIds.length) {
        return NextResponse.json({ error: "Invalid attachment list" }, { status: 400 });
      }
      const storedFiles = await db.select({
        id: files.id,
        customerId: files.customerId,
        relatedType: files.relatedType,
        relatedId: files.relatedId,
        fileName: files.fileName,
        fileType: files.fileType,
        fileSize: files.fileSize,
        fileUrl: files.fileUrl,
      }).from(files).where(inArray(files.id, attachmentIds));
      if (storedFiles.length !== attachmentIds.length || storedFiles.some((file) =>
        file.customerId !== conv.customerId || file.relatedType !== "conversation" || file.relatedId !== conversationId
      )) {
        return NextResponse.json({ error: "One or more attachments are not available to this conversation" }, { status: 403 });
      }
      safeAttachments = storedFiles.map((file) => ({
        id: file.id,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        fileUrl: file.fileUrl,
      }));
    }

    // 1. Insert message
    const [newMsg] = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: user.id,
        senderRole: user.role,
        senderName: user.fullName,
        content: trimmedContent || (safeAttachments.length === 1 ? safeAttachments[0].fileName : `${safeAttachments.length} files`),
        isInternalNote: Boolean(isInternalNote),
        isRead: false,
        attachments: safeAttachments.length ? JSON.stringify(safeAttachments) : null,
      })
      .returning();

    // 2. Update conversation timestamp
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));

    // 3. Dispatch Notifications (if NOT an internal note)
    if (!isInternalNote) {
      if (user.role === "customer") {
        // Customer sent message -> Notify assigned agent or supervisor
        const [customerAssignment] = await db.select({ assignedAgentId: customers.assignedAgentId })
          .from(customers).where(eq(customers.id, conv.customerId)).limit(1);
        const recipientAgentId = conv.assignedAgentId || customerAssignment?.assignedAgentId;
        if (recipientAgentId) {
          const [ag] = await db.select().from(agents).where(eq(agents.id, recipientAgentId)).limit(1);
          if (ag) {
            await sendNotification({
              userId: ag.userId,
              type: "NEW_MESSAGE",
              title: `New message from ${user.fullName}`,
              body: (trimmedContent || "Shared an attachment").substring(0, 100),
              link: `/agent/conversations?conversationId=${conversationId}`,
            });
          }
        }
      } else {
        // Agent or Admin sent message -> Notify customer
        const [cust] = await db
          .select({ userId: customers.userId })
          .from(customers)
          .where(eq(customers.id, conv.customerId))
          .limit(1);

        if (cust) {
          await sendNotification({
            userId: cust.userId,
            type: "NEW_MESSAGE",
            title: `New message from Shopify Support (${user.fullName})`,
              body: (trimmedContent || "Shared an attachment").substring(0, 100),
            link: `/customer/messages?conversationId=${conversationId}`,
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: newMsg });
  } catch (error: any) {
    console.error("Error creating message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
