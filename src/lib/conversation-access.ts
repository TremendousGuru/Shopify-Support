import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations, customers, serviceRequests, tickets } from "@/db/schema";

type ConversationAccessTarget = Pick<typeof conversations.$inferSelect, "id" | "customerId" | "ticketId" | "serviceRequestId" | "assignedAgentId">;

export async function canAgentAccessConversation(agentId: string, conversation: ConversationAccessTarget): Promise<boolean> {
  if (conversation.assignedAgentId === agentId) return true;

  const [customer] = await db.select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, conversation.customerId), eq(customers.assignedAgentId, agentId)))
    .limit(1);
  if (customer) return true;

  if (conversation.serviceRequestId) {
    const [request] = await db.select({ id: serviceRequests.id })
      .from(serviceRequests)
      .where(and(eq(serviceRequests.id, conversation.serviceRequestId), eq(serviceRequests.assignedAgentId, agentId)))
      .limit(1);
    if (request) return true;
  }

  if (conversation.ticketId) {
    const [ticket] = await db.select({ id: tickets.id })
      .from(tickets)
      .where(and(eq(tickets.id, conversation.ticketId), eq(tickets.assignedAgentId, agentId)))
      .limit(1);
    if (ticket) return true;
  }

  return false;
}
