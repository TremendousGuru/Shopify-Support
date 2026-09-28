import { NextResponse } from "next/server";
import { db } from "@/db";
import { messages, conversations, customers, users, agents } from "@/db/schema";
import { eq, asc, desc, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { sendNotification } from "@/lib/notifications";

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
    if (user.role === "agent" && conv.assignedAgentId !== user.agent?.id) {
      return NextResponse.json({ error: "Access denied to this conversation" }, { status: 403 });
    }

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

    return NextResponse.json({
      conversation: conv,
      messages: msgs,
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

    if (!conversationId || !content?.trim()) {
      return NextResponse.json({ error: "Conversation ID and message content are required" }, { status: 400 });
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
    if (user.role === "agent" && conv.assignedAgentId !== user.agent?.id) {
      return NextResponse.json({ error: "Access denied to this conversation" }, { status: 403 });
    }

    // 1. Insert message
    const [newMsg] = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: user.id,
        senderRole: user.role,
        senderName: user.fullName,
        content: content.trim(),
        isInternalNote: Boolean(isInternalNote),
        isRead: false,
        attachments: attachments ? JSON.stringify(attachments) : null,
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
        if (conv.assignedAgentId) {
          const [ag] = await db
            .select()
            .from(agents)
            .where(eq(agents.id, conv.assignedAgentId))
            .limit(1);
          if (ag) {
            await sendNotification({
              userId: ag.userId,
              type: "NEW_MESSAGE",
              title: `New message from ${user.fullName}`,
              body: content.trim().substring(0, 100),
              link: `/agent/conversations?id=${conversationId}`,
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
            body: content.trim().substring(0, 100),
            link: `/customer/messages?id=${conversationId}`,
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
