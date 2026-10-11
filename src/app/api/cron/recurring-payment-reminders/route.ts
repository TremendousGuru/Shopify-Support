import { NextResponse } from "next/server";
import { and, eq, inArray, isNotNull, isNull, lte, lt, or } from "drizzle-orm";
import { db } from "@/db";
import { agents, customers, serviceOrders } from "@/db/schema";
import { sendNotification } from "@/lib/notifications";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dueOrders = await db.select().from(serviceOrders).where(and(
    isNotNull(serviceOrders.recurringInterval),
    isNotNull(serviceOrders.nextPaymentDueAt),
    lte(serviceOrders.nextPaymentDueAt, now),
    inArray(serviceOrders.status, ["In Progress", "Review in Progress", "Awaiting Final Payment"]),
    or(isNull(serviceOrders.lastRecurringReminderAt), lt(serviceOrders.lastRecurringReminderAt, serviceOrders.nextPaymentDueAt))
  ));

  let remindersSent = 0;
  for (const order of dueOrders) {
    const dueAt = order.nextPaymentDueAt;
    if (!dueAt) continue;
    const [claimed] = await db.update(serviceOrders)
      .set({ lastRecurringReminderAt: dueAt, updatedAt: now })
      .where(and(
        eq(serviceOrders.id, order.id),
        eq(serviceOrders.nextPaymentDueAt, dueAt),
        or(isNull(serviceOrders.lastRecurringReminderAt), lt(serviceOrders.lastRecurringReminderAt, dueAt))
      ))
      .returning({ id: serviceOrders.id });
    if (!claimed) continue;

    const [customer] = await db.select({ userId: customers.userId }).from(customers).where(eq(customers.id, order.customerId)).limit(1);
    if (customer) {
      await sendNotification({
        userId: customer.userId,
        type: "SERVICE_REQUEST_UPDATED",
        title: `Recurring payment due for ${order.orderCode}`,
        body: `${order.amount} ${order.currency} is due for your ${order.recurringInterval} service.`,
        link: "/customer/service-requests",
      });
    }
    if (order.assignedAgentId) {
      const [agent] = await db.select({ userId: agents.userId }).from(agents).where(eq(agents.id, order.assignedAgentId)).limit(1);
      if (agent) {
        await sendNotification({
          userId: agent.userId,
          type: "SERVICE_REQUEST_UPDATED",
          title: `Recurring payment due: ${order.orderCode}`,
          body: `The customer’s ${order.recurringInterval} service payment is due.`,
          link: "/agent/conversations",
        });
      }
    }
    remindersSent += 1;
  }

  return NextResponse.json({ success: true, remindersSent });
}
