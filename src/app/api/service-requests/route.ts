import { NextResponse } from "next/server";
import { db } from "@/db";
import { serviceRequests, services, customers, agents, users, conversations, serviceOrders, messages } from "@/db/schema";
import { and, eq, desc, gt } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { sendNotification } from "@/lib/notifications";
import { isAdminRole } from "@/lib/portal-access";

const QUOTE_VALIDITY_DAYS = 30;
const MAX_QUOTE_AMOUNT = 2_147_483_647;

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let list: any[] = [];

    if (user.role === "customer" && user.customer) {
      list = await db
        .select()
        .from(serviceRequests)
        .where(eq(serviceRequests.customerId, user.customer.id))
        .orderBy(desc(serviceRequests.createdAt));
    } else if (user.role === "agent" && user.agent) {
      list = await db
        .select()
        .from(serviceRequests)
        .where(eq(serviceRequests.assignedAgentId, user.agent.id))
        .orderBy(desc(serviceRequests.createdAt));
    } else if (isAdminRole(user.role)) {
      list = await db.select().from(serviceRequests).orderBy(desc(serviceRequests.createdAt));
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Enrich with service and customer details
    const enriched = await Promise.all(
      list.map(async (reqItem) => {
        const [serv] = await db
          .select()
          .from(services)
          .where(eq(services.id, reqItem.serviceId))
          .limit(1);

        const [cust] = await db
          .select({
            id: customers.id,
            customerCode: customers.customerCode,
            businessName: customers.businessName,
            websiteUrl: customers.websiteUrl,
          })
          .from(customers)
          .where(eq(customers.id, reqItem.customerId))
          .limit(1);

        let agentInfo = null;
        if (reqItem.assignedAgentId) {
          const [ag] = await db
            .select({
              id: agents.id,
              agentCode: agents.agentCode,
              userId: agents.userId,
            })
            .from(agents)
            .where(eq(agents.id, reqItem.assignedAgentId))
            .limit(1);

          if (ag) {
            const [u] = await db
              .select({ fullName: users.fullName })
              .from(users)
              .where(eq(users.id, ag.userId))
              .limit(1);
            agentInfo = { ...ag, fullName: u?.fullName };
          }
        }

        // Get linked conversation if exists
        const [conv] = await db
          .select({ id: conversations.id })
          .from(conversations)
          .where(eq(conversations.serviceRequestId, reqItem.id))
          .limit(1);

        const [recommendationMessage] = conv ? [] : await db
          .select({ conversationId: messages.conversationId })
          .from(messages)
          .where(eq(messages.serviceRequestId, reqItem.id))
          .limit(1);

        const [order] = await db
          .select()
          .from(serviceOrders)
          .where(eq(serviceOrders.serviceRequestId, reqItem.id))
          .limit(1);

        return {
          ...reqItem,
          quoteExpired: !!reqItem.quoteExpiresAt && reqItem.quoteExpiresAt <= new Date(),
          service: serv,
          customer: cust,
          assignedAgent: agentInfo,
          conversationId: conv?.id || recommendationMessage?.conversationId || null,
          order: order || null,
        };
      })
    );

    return NextResponse.json({ requests: enriched });
  } catch (error: any) {
    console.error("Error fetching service requests:", error);
    return NextResponse.json({ error: "Failed to fetch service requests" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "customer" || !user.customer) {
      return NextResponse.json({ error: "Customer authentication required" }, { status: 403 });
    }

    const body = await request.json();
    const { serviceId, storeUrl, description, goals, desiredTimeframe } = body;

    if (!serviceId || !description) {
      return NextResponse.json({ error: "Service and description are required" }, { status: 400 });
    }

    const [catalogService] = await db
      .select()
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);

    if (!catalogService || !catalogService.isActive) {
      return NextResponse.json({ error: "Choose an active service from the catalog" }, { status: 400 });
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const requestCode = `REQ-2026-${randomNum}`;

    const [createdRequest] = await db
      .insert(serviceRequests)
      .values({
        requestCode,
        customerId: user.customer.id,
        serviceId,
        status: "Submitted",
        storeUrl: storeUrl?.trim() || user.customer.websiteUrl || "",
        description: description.trim(),
        goals: goals?.trim() || null,
        desiredTimeframe: desiredTimeframe?.trim() || "Standard",
        assignedAgentId: user.customer.assignedAgentId || null,
      })
      .returning();

    // Create service request conversation
    const [conv] = await db
      .insert(conversations)
      .values({
        type: "service_request",
        customerId: user.customer.id,
        serviceRequestId: createdRequest.id,
        assignedAgentId: user.customer.assignedAgentId || null,
        subject: `Service: ${requestCode}`,
        isSensitive: true,
        status: "active",
      })
      .returning();

    // Notify assigned agent
    if (user.customer.assignedAgentId) {
      const [ag] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, user.customer.assignedAgentId))
        .limit(1);
      if (ag) {
        await sendNotification({
          userId: ag.userId,
          type: "SERVICE_REQUEST_UPDATED",
          title: `New Service Request: ${requestCode}`,
          body: `${user.customer.businessName} submitted a service request.`,
          link: `/agent/conversations?conversationId=${conv.id}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      request: createdRequest,
      conversationId: conv.id,
    });
  } catch (error: any) {
    console.error("Service request creation error:", error);
    return NextResponse.json({ error: "Failed to create service request" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      requestId,
      status,
      assignedAgentId,
      quotePrice,
      quoteTimeline,
      quoteTerms,
      quoteBillingInterval,
      quoteStatus,
      quoteExpiresAt,
    } = body;
    const presentedQuoteExpiresAt = typeof quoteExpiresAt === "string" ? new Date(quoteExpiresAt) : null;

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    }

    const [existingReq] = await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.id, requestId))
      .limit(1);

    if (!existingReq) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const isStaff = user.role === "agent" || ["system_admin", "support_supervisor"].includes(user.role);
    if (!isStaff && user.role !== "customer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (user.role === "agent" && existingReq.assignedAgentId !== user.agent?.id) {
      return NextResponse.json({ error: "Access denied to this service request" }, { status: 403 });
    }

    if (isStaff && status) {
      const allowedStatuses = ["Submitted", "Under Review", "Needs Information", "Quoted", "In Progress", "Quality Review", "Completed", "Closed", "Cancelled"];
      if (!allowedStatuses.includes(status)) return NextResponse.json({ error: "Invalid service request status" }, { status: 400 });
      if (status === "Cancelled") return NextResponse.json({ error: "Use the order workflow to cancel an approved service" }, { status: 409 });
      if (["In Progress", "Quality Review", "Completed", "Closed"].includes(status)) {
        return NextResponse.json({ error: "Use the service order workflow for payment, delivery, completion evidence, and customer review" }, { status: 409 });
      }
    }

    const updateData: any = { updatedAt: new Date() };

    // Customer can accept/decline quotes or cancel submitted requests
    if (user.role === "customer") {
      if (existingReq.customerId !== user.customer?.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (quoteStatus !== undefined && !["Accepted", "Declined"].includes(quoteStatus)) {
        return NextResponse.json({ error: "Customers can only accept or decline a quote" }, { status: 400 });
      }

      if (quoteStatus && ["Accepted", "Declined"].includes(quoteStatus)) {
        if (
          existingReq.quoteStatus !== "Sent" ||
          existingReq.status !== "Quoted" ||
          !presentedQuoteExpiresAt || Number.isNaN(presentedQuoteExpiresAt.getTime()) ||
          !existingReq.quoteExpiresAt || presentedQuoteExpiresAt.getTime() !== existingReq.quoteExpiresAt.getTime() ||
          !Number.isSafeInteger(existingReq.quotePrice) || existingReq.quotePrice! < 1 ||
          !existingReq.quoteTimeline?.trim() || !existingReq.quoteTerms?.trim() ||
          !existingReq.quoteExpiresAt || existingReq.quoteExpiresAt <= new Date()
        ) {
          return NextResponse.json({ error: "There is no active quote to review" }, { status: 409 });
        }
        updateData.quoteStatus = quoteStatus;
        if (quoteStatus === "Accepted") {
          updateData.status = "Approved";
        }
      } else if (status === "Cancelled") {
        const [existingOrder] = await db.select({ id: serviceOrders.id }).from(serviceOrders).where(eq(serviceOrders.serviceRequestId, requestId)).limit(1);
        if (existingOrder || ["Accepted"].includes(existingReq.quoteStatus || "")) {
          return NextResponse.json({ error: "An approved request must be managed through its service order" }, { status: 409 });
        }
        updateData.status = "Cancelled";
      } else if (quotePrice !== undefined || quoteTimeline !== undefined || quoteTerms !== undefined || status !== undefined) {
        return NextResponse.json({ error: "Customers can only review an active quote or cancel a request" }, { status: 400 });
      }
    } else if (isStaff) {
      if (status) updateData.status = status;
      if (assignedAgentId !== undefined && user.role !== "agent") {
        if (user.role !== "system_admin") return NextResponse.json({ error: "Only a system administrator can reassign service requests" }, { status: 403 });
        if (assignedAgentId) {
          const [activeAgent] = await db.select({ id: agents.id, status: agents.status, isActive: users.isActive })
            .from(agents).innerJoin(users, eq(users.id, agents.userId)).where(eq(agents.id, assignedAgentId)).limit(1);
          if (!activeAgent?.isActive || activeAgent.status === "Terminated") return NextResponse.json({ error: "Choose an active agent" }, { status: 400 });
        }
        updateData.assignedAgentId = assignedAgentId || null;
      }
      const quoteIsBeingEdited = quotePrice !== undefined || quoteTimeline !== undefined || quoteTerms !== undefined || quoteStatus !== undefined;
      if (quoteIsBeingEdited) {
        if (user.role !== "agent" || existingReq.assignedAgentId !== user.agent?.id) {
          return NextResponse.json({ error: "Only the assigned agent can prepare a quote" }, { status: 403 });
        }
        if (quoteStatus !== "Sent") {
          return NextResponse.json({ error: "A quote must be sent with a valid price, timeline, and terms" }, { status: 400 });
        }
        if (existingReq.quoteStatus === "Accepted") {
          return NextResponse.json({ error: "An accepted quote cannot be changed" }, { status: 409 });
        }
        const [existingOrder] = await db.select({ id: serviceOrders.id }).from(serviceOrders).where(eq(serviceOrders.serviceRequestId, requestId)).limit(1);
        if (existingOrder) return NextResponse.json({ error: "This request already has an order" }, { status: 409 });
        const nextPrice = quotePrice === undefined ? existingReq.quotePrice : Number(quotePrice);
        const nextTimeline = quoteTimeline === undefined ? existingReq.quoteTimeline : quoteTimeline;
        const nextTerms = quoteTerms === undefined ? existingReq.quoteTerms : quoteTerms;
        if (!Number.isSafeInteger(nextPrice) || nextPrice! < 1 || nextPrice! > MAX_QUOTE_AMOUNT) {
          return NextResponse.json({ error: "Quote price must be a positive whole number" }, { status: 400 });
        }
        if (typeof nextTimeline !== "string" || !nextTimeline.trim() || nextTimeline.length > 120) {
          return NextResponse.json({ error: "Quote timeline is required and must be 120 characters or fewer" }, { status: 400 });
        }
        if (typeof nextTerms !== "string" || !nextTerms.trim() || nextTerms.length > 4000) {
          return NextResponse.json({ error: "Quote terms are required and must be 4,000 characters or fewer" }, { status: 400 });
        }
        if (quoteBillingInterval !== undefined && ![null, "monthly", "quarterly", "yearly"].includes(quoteBillingInterval)) {
          return NextResponse.json({ error: "Choose a valid recurring interval" }, { status: 400 });
        }
        updateData.quotePrice = nextPrice;
        updateData.quoteTimeline = nextTimeline.trim();
        updateData.quoteTerms = nextTerms.trim();
        if (quoteBillingInterval !== undefined) updateData.quoteBillingInterval = quoteBillingInterval || null;
        updateData.quoteStatus = "Sent";
        updateData.quoteExpiresAt = new Date(Date.now() + QUOTE_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
        updateData.status = "Quoted";
      }
    }

    let createdOrder = null;
    const [updated] = await db.transaction(async (tx) => {
      const conditions = [eq(serviceRequests.id, requestId)];
      if (user.role === "customer" && quoteStatus) {
        conditions.push(eq(serviceRequests.quoteStatus, "Sent"));
        conditions.push(eq(serviceRequests.status, "Quoted"));
        conditions.push(eq(serviceRequests.quoteExpiresAt, presentedQuoteExpiresAt!));
        conditions.push(gt(serviceRequests.quoteExpiresAt, new Date()));
      }
      const [requestUpdate] = await tx
        .update(serviceRequests)
        .set(updateData)
        .where(and(...conditions))
        .returning();

      if (!requestUpdate) return [null];

      if (user.role === "customer" && quoteStatus === "Accepted") {
        const [service] = await tx.select().from(services).where(eq(services.id, existingReq.serviceId)).limit(1);
        if (!service) throw new Error("Service not found for approved request");
        const orderCode = `ORD-${new Date().getFullYear()}-${requestId.slice(0, 8).toUpperCase()}`;
        [createdOrder] = await tx.insert(serviceOrders).values({
          orderCode,
          serviceRequestId: requestId,
          customerId: existingReq.customerId,
          serviceId: existingReq.serviceId,
          assignedAgentId: existingReq.assignedAgentId,
          serviceName: service.name,
          amount: existingReq.quotePrice!,
          status: "Awaiting Payment",
          paymentStatus: "unpaid",
          recurringInterval: existingReq.quoteBillingInterval,
          nextPaymentDueAt: existingReq.quoteBillingInterval ? new Date() : null,
        }).onConflictDoNothing({ target: serviceOrders.serviceRequestId }).returning();
      }

      return [requestUpdate];
    });

    if (!updated) {
      return NextResponse.json({ error: "The quote has already been reviewed" }, { status: 409 });
    }

    // Notify customer on status update or quote sent
    const [cust] = await db
      .select({ userId: customers.userId })
      .from(customers)
      .where(eq(customers.id, existingReq.customerId))
      .limit(1);

    const [requestConversation] = await db.select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.serviceRequestId, requestId))
      .limit(1);

    if (cust && user.role !== "customer") {
      await sendNotification({
        userId: cust.userId,
        type: updateData.quoteStatus === "Sent" ? "QUOTE_AVAILABLE" : "SERVICE_REQUEST_UPDATED",
        title: `Service Request ${existingReq.requestCode} Updated`,
        body: updateData.quoteStatus === "Sent"
          ? `A formal quote has been prepared for your review.`
          : `Status changed to: ${updated.status}`,
        link: requestConversation ? `/customer/messages?conversationId=${requestConversation.id}` : "/customer/service-requests",
      });
    }

    if (assignedAgentId !== undefined && user.role !== "agent") {
      const nextAgentId = assignedAgentId || null;
      await db.update(conversations).set({ assignedAgentId: nextAgentId }).where(eq(conversations.serviceRequestId, requestId));
      await db.update(serviceOrders).set({ assignedAgentId: nextAgentId, updatedAt: new Date() }).where(eq(serviceOrders.serviceRequestId, requestId));
    }

    if (cust && user.role === "customer" && quoteStatus === "Accepted") {
      const [assignedAgent] = existingReq.assignedAgentId
        ? await db.select({ userId: agents.userId }).from(agents).where(eq(agents.id, existingReq.assignedAgentId)).limit(1)
        : [];
      if (assignedAgent) await sendNotification({ userId: assignedAgent.userId, type: "SERVICE_REQUEST_UPDATED", title: `Order created for ${existingReq.requestCode}`, body: "The customer approved your service quote. Payment is required before work begins.", link: requestConversation ? `/agent/conversations?conversationId=${requestConversation.id}` : "/agent/service-requests" });
    }

    return NextResponse.json({ success: true, request: updated, order: createdOrder });
  } catch (error: any) {
    console.error("Error updating service request:", error);
    return NextResponse.json({ error: "Failed to update service request" }, { status: 500 });
  }
}
