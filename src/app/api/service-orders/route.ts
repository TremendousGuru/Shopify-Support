import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { agents, customers, conversations, serviceOrders, serviceRequests, services, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/portal-access";
import { sendNotification } from "@/lib/notifications";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let orders;
    if (user.role === "customer" && user.customer) {
      orders = await db.select().from(serviceOrders).where(eq(serviceOrders.customerId, user.customer.id)).orderBy(desc(serviceOrders.createdAt));
    } else if (user.role === "agent" && user.agent) {
      orders = await db.select().from(serviceOrders).where(eq(serviceOrders.assignedAgentId, user.agent.id)).orderBy(desc(serviceOrders.createdAt));
    } else if (isAdminRole(user.role)) {
      orders = await db.select().from(serviceOrders).orderBy(desc(serviceOrders.createdAt));
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const enriched = await Promise.all(orders.map(async (order) => {
      const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, order.serviceRequestId)).limit(1);
      const [customer] = await db.select({ businessName: customers.businessName, customerCode: customers.customerCode, userId: customers.userId }).from(customers).where(eq(customers.id, order.customerId)).limit(1);
      const [agent] = order.assignedAgentId
        ? await db.select({ userId: agents.userId }).from(agents).where(eq(agents.id, order.assignedAgentId)).limit(1)
        : [];
      const [agentUser] = agent ? await db.select({ fullName: users.fullName }).from(users).where(eq(users.id, agent.userId)).limit(1) : [];
      const [service] = await db.select({ name: services.name }).from(services).where(eq(services.id, order.serviceId)).limit(1);
      return { ...order, request, customer, serviceName: order.serviceName || service?.name, assignedAgent: agentUser || null };
    }));

    return NextResponse.json({ orders: enriched });
  } catch (error) {
    console.error("Error fetching service orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderId, action, status } = await request.json();
    if (!orderId || !action) return NextResponse.json({ error: "Order and action are required" }, { status: 400 });

    const [order] = await db.select().from(serviceOrders).where(eq(serviceOrders.id, orderId)).limit(1);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const [orderConversation] = await db.select({ id: conversations.id }).from(conversations)
      .where(eq(conversations.serviceRequestId, order.serviceRequestId)).limit(1);
    const customerConversationLink = orderConversation ? `/customer/messages?conversationId=${orderConversation.id}` : "/customer/service-requests";
    const agentConversationLink = orderConversation ? `/agent/conversations?conversationId=${orderConversation.id}` : "/agent/service-requests";

    if (action === "report_payment") {
      if (user.role !== "customer" || order.customerId !== user.customer?.id) {
        return NextResponse.json({ error: "Only the order owner can report payment" }, { status: 403 });
      }
      if (order.paymentStatus !== "unpaid" || order.status !== "Awaiting Payment") {
        return NextResponse.json({ error: "This order is not awaiting payment" }, { status: 409 });
      }

      const [updated] = await db.update(serviceOrders).set({
        paymentStatus: "reported",
        paymentReportedAt: new Date(),
        updatedAt: new Date(),
      }).where(and(eq(serviceOrders.id, orderId), eq(serviceOrders.paymentStatus, "unpaid"))).returning();
      if (!updated) return NextResponse.json({ error: "Payment was already reported" }, { status: 409 });

      if (order.assignedAgentId) {
        const [agent] = await db.select({ userId: agents.userId }).from(agents).where(eq(agents.id, order.assignedAgentId)).limit(1);
        if (agent) await sendNotification({ userId: agent.userId, type: "SERVICE_REQUEST_UPDATED", title: `Payment reported for ${order.orderCode}`, body: "Verify the payment before starting work.", link: agentConversationLink });
      }
      return NextResponse.json({ success: true, order: updated });
    }

    if (user.role !== "agent" || order.assignedAgentId !== user.agent?.id) {
      return NextResponse.json({ error: "Only the assigned agent can manage payment and delivery" }, { status: 403 });
    }

    if (action === "confirm_payment") {
      if (order.paymentStatus !== "reported") {
        return NextResponse.json({ error: "Customer must report payment before it can be confirmed" }, { status: 409 });
      }
      const [updated] = await db.update(serviceOrders).set({
        paymentStatus: "confirmed",
        paymentConfirmedAt: new Date(),
        paymentConfirmedBy: user.id,
        status: "Ready to Start",
        updatedAt: new Date(),
      }).where(and(eq(serviceOrders.id, orderId), eq(serviceOrders.paymentStatus, "reported"))).returning();
      if (!updated) return NextResponse.json({ error: "Payment was already confirmed" }, { status: 409 });
      const [customer] = await db.select({ userId: customers.userId }).from(customers).where(eq(customers.id, order.customerId)).limit(1);
      if (customer) await sendNotification({ userId: customer.userId, type: "SERVICE_REQUEST_UPDATED", title: `Payment confirmed for ${order.orderCode}`, body: "Your service order is ready to begin.", link: customerConversationLink });
      return NextResponse.json({ success: true, order: updated });
    }

    if (action === "update_status") {
      const allowedTransitions: Record<string, string[]> = {
        "Ready to Start": ["In Progress"],
        "In Progress": ["Quality Review", "Completed"],
        "Quality Review": ["In Progress", "Completed"],
        Completed: ["Closed"],
      };
      if (!allowedTransitions[order.status]?.includes(status)) {
        return NextResponse.json({ error: "Invalid delivery status" }, { status: 400 });
      }
      if (order.paymentStatus !== "confirmed") {
        return NextResponse.json({ error: "Payment must be confirmed before work can begin" }, { status: 409 });
      }
      const [updated] = await db.update(serviceOrders).set({
        status,
        workStartedAt: status === "In Progress" ? order.workStartedAt || new Date() : order.workStartedAt,
        updatedAt: new Date(),
      }).where(and(eq(serviceOrders.id, orderId), eq(serviceOrders.paymentStatus, "confirmed"))).returning();
      if (!updated) return NextResponse.json({ error: "Payment must be confirmed before delivery" }, { status: 409 });
      await db.update(serviceRequests).set({ status, updatedAt: new Date() }).where(eq(serviceRequests.id, order.serviceRequestId));
      const [customer] = await db.select({ userId: customers.userId }).from(customers).where(eq(customers.id, order.customerId)).limit(1);
      if (customer) await sendNotification({ userId: customer.userId, type: "SERVICE_REQUEST_UPDATED", title: `Order ${order.orderCode} updated`, body: `Your service order is now ${status}.`, link: customerConversationLink });
      return NextResponse.json({ success: true, order: updated });
    }

    return NextResponse.json({ error: "Unsupported order action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating service order:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
