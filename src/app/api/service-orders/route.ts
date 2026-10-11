import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { agents, customers, conversations, files, messages, serviceOrders, serviceRequests, services, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/portal-access";
import { sendNotification } from "@/lib/notifications";

function nextRecurringDate(from: Date, interval: string | null): Date | null {
  if (!interval) return null;
  const next = new Date(from);
  if (interval === "monthly") next.setMonth(next.getMonth() + 1);
  else if (interval === "quarterly") next.setMonth(next.getMonth() + 3);
  else if (interval === "yearly") next.setFullYear(next.getFullYear() + 1);
  else return null;
  return next;
}

function estimatedDeliveryDate(start: Date, timeline: string): Date {
  const ranges = timeline.match(/\d+/g)?.map(Number) || [7];
  const days = Math.max(1, Math.min(365, Math.max(...ranges)));
  const due = new Date(start);
  if (/business|working/i.test(timeline)) {
    let weekdaysAdded = 0;
    while (weekdaysAdded < days) {
      due.setDate(due.getDate() + 1);
      if (due.getDay() !== 0 && due.getDay() !== 6) weekdaysAdded += 1;
    }
  } else {
    due.setDate(due.getDate() + days);
  }
  return due;
}

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
      return {
        ...order,
        request,
        customer,
        serviceName: order.serviceName || service?.name,
        assignedAgent: agentUser || null,
        recurringPaymentDue: !!order.recurringInterval && !!order.nextPaymentDueAt && order.nextPaymentDueAt <= new Date(),
      };
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

    const { orderId, action, status, amount, completionFileId, reviewNote } = await request.json();
    if (!orderId || !action) return NextResponse.json({ error: "Order and action are required" }, { status: 400 });

    const [order] = await db.select().from(serviceOrders).where(eq(serviceOrders.id, orderId)).limit(1);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    let [orderConversation] = await db.select({ id: conversations.id }).from(conversations)
      .where(eq(conversations.serviceRequestId, order.serviceRequestId)).limit(1);
    if (!orderConversation) {
      const [recommendationMessage] = await db.select({ conversationId: messages.conversationId })
        .from(messages).where(eq(messages.serviceRequestId, order.serviceRequestId)).limit(1);
      if (recommendationMessage) orderConversation = { id: recommendationMessage.conversationId };
    }
    const customerConversationLink = orderConversation ? `/customer/messages?conversationId=${orderConversation.id}` : "/customer/service-requests";
    const agentConversationLink = orderConversation ? `/agent/conversations?conversationId=${orderConversation.id}` : "/agent/service-requests";

    if (action === "report_payment") {
      if (user.role !== "customer" || order.customerId !== user.customer?.id) {
        return NextResponse.json({ error: "Only the order owner can report payment" }, { status: 403 });
      }
      const recurringPaymentDue = !!order.recurringInterval && !!order.nextPaymentDueAt && order.nextPaymentDueAt <= new Date() && order.paymentStatus === "confirmed";
      if ((!["unpaid", "partial"].includes(order.paymentStatus) && !recurringPaymentDue) || !["Awaiting Payment", "Ready to Start", "In Progress", "Awaiting Final Payment"].includes(order.status)) {
        return NextResponse.json({ error: "This order cannot accept a payment report right now" }, { status: 409 });
      }
      const cyclePaid = recurringPaymentDue ? 0 : order.amountPaid;
      const remaining = Math.max(order.amount - cyclePaid, 0);
      const reportedAmount = amount === undefined ? remaining : Number(amount);
      if (!Number.isSafeInteger(reportedAmount) || reportedAmount < 1 || reportedAmount > 2_147_483_647) {
        return NextResponse.json({ error: "Enter a valid payment amount" }, { status: 400 });
      }

      const [updated] = await db.update(serviceOrders).set({
        paymentStatus: "reported",
        paymentReportedAt: new Date(),
        paymentReportedAmount: reportedAmount,
        updatedAt: new Date(),
      }).where(and(eq(serviceOrders.id, orderId), eq(serviceOrders.paymentStatus, order.paymentStatus))).returning();
      if (!updated) return NextResponse.json({ error: "Payment was already reported" }, { status: 409 });

      if (order.assignedAgentId) {
        const [agent] = await db.select({ userId: agents.userId }).from(agents).where(eq(agents.id, order.assignedAgentId)).limit(1);
        if (agent) await sendNotification({ userId: agent.userId, type: "SERVICE_REQUEST_UPDATED", title: `Payment reported for ${order.orderCode}`, body: "Verify the payment before starting work.", link: agentConversationLink });
      }
      return NextResponse.json({ success: true, order: updated });
    }

    if (action === "customer_review") {
      if (user.role !== "customer" || order.customerId !== user.customer?.id || order.status !== "Review in Progress") {
        return NextResponse.json({ error: "This order is not available for customer review" }, { status: 403 });
      }
      if (!(["satisfied", "request_changes"].includes(status))) {
        return NextResponse.json({ error: "Choose whether you are satisfied or need changes" }, { status: 400 });
      }
      if (status === "request_changes" && (typeof reviewNote !== "string" || reviewNote.trim().length < 5)) {
        return NextResponse.json({ error: "Please describe the changes you need" }, { status: 400 });
      }
      const nextStatus = status === "satisfied"
        ? order.amountPaid >= order.amount ? "Completed" : "Awaiting Final Payment"
        : "Revision Requested";
      const [updated] = await db.update(serviceOrders).set({
        status: nextStatus,
        customerSatisfiedAt: status === "satisfied" ? new Date() : null,
        customerReviewNote: typeof reviewNote === "string" ? reviewNote.trim() || null : null,
        updatedAt: new Date(),
      }).where(and(eq(serviceOrders.id, orderId), eq(serviceOrders.status, "Review in Progress"))).returning();
      if (!updated) return NextResponse.json({ error: "This order was already reviewed" }, { status: 409 });
      await db.update(serviceRequests).set({ status: nextStatus, updatedAt: new Date() }).where(eq(serviceRequests.id, order.serviceRequestId));
      if (order.assignedAgentId) {
        const [agent] = await db.select({ userId: agents.userId }).from(agents).where(eq(agents.id, order.assignedAgentId)).limit(1);
        if (agent) await sendNotification({ userId: agent.userId, type: "SERVICE_REQUEST_UPDATED", title: `Customer reviewed ${order.orderCode}`, body: status === "satisfied" ? "The customer is satisfied with the delivery." : "The customer requested changes.", link: agentConversationLink });
      }
      return NextResponse.json({ success: true, order: updated });
    }

    if (user.role !== "agent" || order.assignedAgentId !== user.agent?.id) {
      return NextResponse.json({ error: "Only the assigned agent can manage payment and delivery" }, { status: 403 });
    }

    if (["confirm_payment", "confirm_partial_payment"].includes(action)) {
      if (order.paymentStatus !== "reported") {
        return NextResponse.json({ error: "Customer must report payment before it can be confirmed" }, { status: 409 });
      }
      const reportedAmount = order.paymentReportedAmount || 0;
      const recurringPaymentDue = !!order.recurringInterval && !!order.nextPaymentDueAt && order.nextPaymentDueAt <= new Date() && order.paymentStatus === "reported";
      const totalPaid = (recurringPaymentDue ? 0 : order.amountPaid) + reportedAmount;
      const isFullPayment = totalPaid >= order.amount;
      if (action === "confirm_payment" && !isFullPayment) {
        return NextResponse.json({ error: "Reported amount is less than the remaining balance. Confirm it as a part payment." }, { status: 409 });
      }
      if (action === "confirm_partial_payment" && isFullPayment) {
        return NextResponse.json({ error: "Reported amount covers the full balance. Confirm full payment instead." }, { status: 409 });
      }
      const nextStatus = order.status === "Awaiting Final Payment" && isFullPayment
        ? "Completed"
        : order.status === "Awaiting Payment" ? "Ready to Start" : order.status;
      const [updated] = await db.update(serviceOrders).set({
        amountPaid: totalPaid,
        paymentStatus: isFullPayment ? "confirmed" : "partial",
        paymentReportedAmount: null,
        paymentConfirmedAt: new Date(),
        paymentConfirmedBy: user.id,
        status: nextStatus,
        nextPaymentDueAt: isFullPayment && order.recurringInterval ? nextRecurringDate(new Date(), order.recurringInterval) : order.nextPaymentDueAt,
        lastRecurringReminderAt: isFullPayment && order.recurringInterval ? null : order.lastRecurringReminderAt,
        updatedAt: new Date(),
      }).where(and(eq(serviceOrders.id, orderId), eq(serviceOrders.paymentStatus, "reported"))).returning();
      if (!updated) return NextResponse.json({ error: "Payment was already confirmed" }, { status: 409 });
      if (nextStatus === "Completed") await db.update(serviceRequests).set({ status: "Completed", updatedAt: new Date() }).where(eq(serviceRequests.id, order.serviceRequestId));
      const [customer] = await db.select({ userId: customers.userId }).from(customers).where(eq(customers.id, order.customerId)).limit(1);
      if (customer) await sendNotification({ userId: customer.userId, type: "SERVICE_REQUEST_UPDATED", title: `${action === "confirm_payment" ? "Full" : "Part"} payment confirmed for ${order.orderCode}`, body: nextStatus === "Completed" ? "Your order is complete." : `${totalPaid} ${order.currency} received. Work may proceed.`, link: customerConversationLink });
      return NextResponse.json({ success: true, order: updated });
    }

    if (action === "update_status") {
      const allowedTransitions: Record<string, string[]> = {
        "Ready to Start": ["In Progress"],
        "In Progress": ["Quality Review", "Completed"],
        "Quality Review": ["In Progress", "Completed"],
        "Revision Requested": ["In Progress"],
      };
      if (!allowedTransitions[order.status]?.includes(status)) {
        return NextResponse.json({ error: "Invalid delivery status" }, { status: 400 });
      }
      if (order.amountPaid < 1) {
        return NextResponse.json({ error: "Payment must be confirmed before work can begin" }, { status: 409 });
      }

      let completionFile = null;
      if (status === "Completed") {
        if (!completionFileId) return NextResponse.json({ error: "Attach a completion image before completing the project" }, { status: 400 });
        const [file] = await db.select().from(files).where(eq(files.id, completionFileId)).limit(1);
        if (!file || file.customerId !== order.customerId || file.uploadedBy !== user.id || file.relatedType !== "service_order" || file.relatedId !== orderId || !file.fileType.startsWith("image/")) {
          return NextResponse.json({ error: "Choose an uploaded completion image for this order" }, { status: 400 });
        }
        completionFile = file;
      }
      const nextStatus = status === "Completed" ? "Review in Progress" : status;
      const workStartedAt = status === "In Progress" ? order.workStartedAt || new Date() : order.workStartedAt;
      const timeline = (await db.select({ quoteTimeline: serviceRequests.quoteTimeline }).from(serviceRequests).where(eq(serviceRequests.id, order.serviceRequestId)).limit(1))[0]?.quoteTimeline || "7 days";
      const [updated] = await db.update(serviceOrders).set({
        status: nextStatus,
        workStartedAt,
        deliveryDueAt: status === "In Progress" && !order.workStartedAt ? estimatedDeliveryDate(workStartedAt!, timeline) : order.deliveryDueAt,
        completionFileId: completionFile?.id || order.completionFileId,
        updatedAt: new Date(),
      }).where(and(eq(serviceOrders.id, orderId), eq(serviceOrders.amountPaid, order.amountPaid))).returning();
      if (!updated) return NextResponse.json({ error: "Order changed while you were updating it. Refresh and try again." }, { status: 409 });
      await db.update(serviceRequests).set({ status: nextStatus, updatedAt: new Date() }).where(eq(serviceRequests.id, order.serviceRequestId));
      if (completionFile && orderConversation) {
        const [agent] = await db.select({ fullName: users.fullName }).from(users).where(eq(users.id, user.id)).limit(1);
        await db.insert(messages).values({
          conversationId: orderConversation.id,
          senderId: user.id,
          senderRole: user.role,
          senderName: agent?.fullName || "Support Agent",
          content: `Project ${order.orderCode} is complete and ready for your review.`,
          attachments: JSON.stringify([{ id: completionFile.id, fileName: completionFile.fileName, fileType: completionFile.fileType, fileSize: completionFile.fileSize, fileUrl: completionFile.fileUrl }]),
        });
        await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, orderConversation.id));
      }
      const [customer] = await db.select({ userId: customers.userId }).from(customers).where(eq(customers.id, order.customerId)).limit(1);
      if (customer) await sendNotification({ userId: customer.userId, type: "SERVICE_REQUEST_UPDATED", title: status === "Completed" ? `Project ${order.orderCode} ready to review` : `Order ${order.orderCode} updated`, body: status === "Completed" ? "Your agent shared the completed work for review." : `Your service order is now ${status}.`, link: customerConversationLink });
      return NextResponse.json({ success: true, order: updated });
    }

    return NextResponse.json({ error: "Unsupported order action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating service order:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
