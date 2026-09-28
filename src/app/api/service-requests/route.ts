import { NextResponse } from "next/server";
import { db } from "@/db";
import { serviceRequests, services, serviceCategories, customers, agents, users, conversations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { sendNotification } from "@/lib/notifications";

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
    } else if (["system_admin", "support_supervisor"].includes(user.role)) {
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

        return {
          ...reqItem,
          service: serv,
          customer: cust,
          assignedAgent: agentInfo,
          conversationId: conv?.id || null,
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

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const requestCode = `REQ-2026-${randomNum}`;

    const [newRequest] = await db
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
        serviceRequestId: newRequest.id,
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
          link: `/agent/service-requests/${newRequest.id}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      request: newRequest,
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
      quoteStatus,
    } = body;

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

    if (user.role === "agent" && existingReq.assignedAgentId !== user.agent?.id) {
      return NextResponse.json({ error: "Access denied to this service request" }, { status: 403 });
    }

    const updateData: any = { updatedAt: new Date() };

    // Customer can accept/decline quotes or cancel submitted requests
    if (user.role === "customer") {
      if (existingReq.customerId !== user.customer?.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (quoteStatus && ["Accepted", "Declined"].includes(quoteStatus)) {
        updateData.quoteStatus = quoteStatus;
        if (quoteStatus === "Accepted") {
          updateData.status = "Approved";
        }
      } else if (status === "Cancelled") {
        updateData.status = "Cancelled";
      }
    } else if (["agent", "system_admin", "support_supervisor"].includes(user.role)) {
      if (status) updateData.status = status;
      if (assignedAgentId !== undefined && user.role !== "agent") updateData.assignedAgentId = assignedAgentId;
      if (quotePrice !== undefined) updateData.quotePrice = Number(quotePrice);
      if (quoteTimeline !== undefined) updateData.quoteTimeline = quoteTimeline;
      if (quoteTerms !== undefined) updateData.quoteTerms = quoteTerms;
      if (quoteStatus !== undefined) updateData.quoteStatus = quoteStatus;
    }

    const [updated] = await db
      .update(serviceRequests)
      .set(updateData)
      .where(eq(serviceRequests.id, requestId))
      .returning();

    // Notify customer on status update or quote sent
    const [cust] = await db
      .select({ userId: customers.userId })
      .from(customers)
      .where(eq(customers.id, existingReq.customerId))
      .limit(1);

    if (cust && user.role !== "customer") {
      await sendNotification({
        userId: cust.userId,
        type: updateData.quoteStatus === "Sent" ? "QUOTE_AVAILABLE" : "SERVICE_REQUEST_UPDATED",
        title: `Service Request ${existingReq.requestCode} Updated`,
        body: updateData.quoteStatus === "Sent"
          ? `A formal quote has been prepared for your review.`
          : `Status changed to: ${updated.status}`,
        link: `/customer/service-requests/${updated.id}`,
      });
    }

    return NextResponse.json({ success: true, request: updated });
  } catch (error: any) {
    console.error("Error updating service request:", error);
    return NextResponse.json({ error: "Failed to update service request" }, { status: 500 });
  }
}
