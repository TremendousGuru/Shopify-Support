import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  users,
  customers,
  stores,
  agents,
  tickets,
  conversations,
  consentRecords,
  notificationPreferences,
} from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { randomInt } from "node:crypto";
import { hashPassword, generateCustomerCode, createSession } from "@/lib/auth";
import { verifyAgentSignupToken } from "@/lib/agent-links";
import { sendNotification } from "@/lib/notifications";
// Check that all required tables exist in the database. If a table is
// missing (e.g. the deployed DB was initialized with an older schema), throw
// a clear, actionable error instead of a cryptic Postgres "Failed query".
// Check that all required tables exist in the database. If a table is
// missing (e.g. the deployed DB was initialized with an older schema), throw
// a clear, actionable error instead of a cryptic Postgres "Failed query".
export async function ensureRequiredTablesExist() {
  const requiredTables = ["users", "customers", "stores", "agents", "tickets", "conversations", "messages", "serviceRequests"];
  const missingTables: string[] = [];

  for (const table of requiredTables) {
    try {
      // Use a count query against the table. If the table does not exist,
      // the query will throw and we record the missing table.
      const count = await db.execute(
        `SELECT COUNT(*)::INT AS count FROM "${table}"`
      );
      const countValue = (count as unknown as { row: { count: number } }).row?.count;
      if (countValue === undefined || countValue === 0) {
        missingTables.push(table);
      }
    } catch {
      missingTables.push(table);
    }
  }

  if (missingTables.length > 0) {
    throw new Error(
      `Database schema is incomplete. Missing tables: ${missingTables.join(", ")}. ` +
      "Please run the database setup: see README.md for instructions on applying the schema (drizzle-kit push or npm run db:push)."
    );
  }
}

export async function POST(request: Request) {
  try {
    // Ensure the deployed database schema matches this codebase before
    // attempting any writes. This catches the "Failed query: insert into
    // stores..." error when the database hasn't been initialized/pushed.
    await ensureRequiredTablesExist();
    const body = await request.json();
    const {
      email,
      password,
      fullName,
      businessName,
      phone,
      websiteUrl,
      storeName,
      storeUrl,
      storeCategory,
      businessStage,
      primaryGoals,
      termsAccepted,
      privacyPolicyAccepted,
      supportPolicyAccepted,
      marketingConsent,
      existingTicketNumber,
      agentToken: requestedAgentToken,
    } = body;

    if (!email || !password || !businessName) {
      return NextResponse.json(
        { error: "Missing required onboarding information" },
        { status: 400 }
      );
    }

    if (String(password).length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (!termsAccepted || !privacyPolicyAccepted || !supportPolicyAccepted) {
      return NextResponse.json(
        { error: "You must accept the Terms, Privacy Notice, and support communications policy." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanTicketNumber = String(existingTicketNumber || "").trim().toUpperCase();
    const agentCode = requestedAgentToken
      ? verifyAgentSignupToken(String(requestedAgentToken))
      : null;

    if (requestedAgentToken && !agentCode) {
      return NextResponse.json({ error: "This agent signup link is invalid" }, { status: 400 });
    }

    if (cleanTicketNumber.length > 64) {
      return NextResponse.json({ error: "Ticket number must be 64 characters or fewer" }, { status: 400 });
    }

    const [existing] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in instead." },
        { status: 409 }
      );
    }

    const agentQuery = db
      .select({
        id: agents.id,
        userId: agents.userId,
        agentCode: agents.agentCode,
      })
      .from(agents)
      .innerJoin(users, eq(agents.userId, users.id))
      .where(agentCode
        ? and(eq(agents.agentCode, agentCode), eq(users.isActive, true))
        : and(eq(agents.status, "Available"), eq(users.isActive, true)))
      .orderBy(asc(agents.agentCode))
      .limit(1);
    const [assignedAgent] = await agentQuery;

    if (!assignedAgent) {
      return NextResponse.json(
        { error: agentCode ? "This agent link is no longer active" : "No support agents are currently available" },
        { status: 409 }
      );
    }

    let ticketCode = `TKT-${randomInt(100000, 1000000)}`;
    for (let attempt = 0; attempt < 5; attempt++) {
      const [existingTicket] = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.ticketCode, ticketCode)).limit(1);
      if (!existingTicket) break;
      ticketCode = `TKT-${randomInt(100000, 1000000)}`;
    }

    const result = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          email: cleanEmail,
          passwordHash: hashPassword(password),
          fullName: typeof fullName === "string" && fullName.trim() ? fullName.trim() : businessName.trim(),
          role: "customer",
          phone: phone?.trim() || null,
          isActive: true,
          isEmailVerified: true,
        })
        .returning();

      let customerCode = generateCustomerCode();
      for (let attempt = 0; attempt < 5; attempt++) {
        const [existingCustomer] = await tx
          .select({ id: customers.id })
          .from(customers)
          .where(eq(customers.customerCode, customerCode))
          .limit(1);
        if (!existingCustomer) break;
        customerCode = generateCustomerCode();
      }

      const [newCustomer] = await tx
        .insert(customers)
        .values({
          userId: newUser.id,
          customerCode,
          businessName: businessName.trim(),
          websiteUrl: websiteUrl?.trim() || storeUrl?.trim() || null,
          ecommercePlatform: "Shopify",
          storeCategory: storeCategory || "General Merchandise",
          businessStage: businessStage || "Active Store",
          primaryGoals: primaryGoals?.trim() || "Improve store performance & conversion",
          supportStatus: "Activated",
          assignedAgentId: assignedAgent.id,
        })
        .returning();

      // Insert store record explicitly. We specify columns so the query
      // matches the database schema exactly (avoids the "insert into stores
      // ... values (default, $1, $2, ...)" failure when the deployed DB is
      // missing or differs from the local schema).
      await tx.insert(stores).values({
        customerId: newCustomer.id,
        storeName: (storeName || businessName).trim(),
        storeUrl: storeUrl?.trim() || null,
        platform: "Shopify",
        niche: storeCategory || "Retail",
        approxMonthlyOrders: null,
        isPrimary: true,
        createdAt: new Date(),
      });

      await tx.insert(consentRecords).values({
        userId: newUser.id,
        termsAccepted: true,
        privacyPolicyAccepted: true,
        supportPolicyAccepted: true,
        marketingConsent: Boolean(marketingConsent),
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: request.headers.get("user-agent") || "Shopify Support Client",
      });

      await tx.insert(notificationPreferences).values({
        userId: newUser.id,
        supportInbox: true,
        emailSupport: true,
        browserPush: true,
        whatsappSupport: false,
        marketingEmails: Boolean(marketingConsent),
        promotionalOffers: Boolean(marketingConsent),
      });

      const initialRequest = primaryGoals?.trim() || `New Shopify support request from ${businessName.trim()}.`;
      const [newTicket] = await tx
        .insert(tickets)
        .values({
          ticketCode,
          externalTicketReference: cleanTicketNumber || null,
          customerId: newCustomer.id,
          subject: `Onboarding support for ${businessName.trim()}`,
          description: cleanTicketNumber
            ? `Existing support ticket ${cleanTicketNumber} submitted during ${businessName.trim()} account onboarding.`
            : initialRequest,
          category: "Shopify Store Support",
          priority: "Normal",
          status: "Open",
          assignedAgentId: assignedAgent.id,
        })
        .returning();

      const [conversation] = await tx
        .insert(conversations)
        .values({
          type: "ticket",
          customerId: newCustomer.id,
          ticketId: newTicket.id,
          assignedAgentId: assignedAgent.id,
          subject: `Ticket ${ticketCode}: Onboarding support`,
          isSensitive: true,
          status: "active",
        })
        .returning();

      return { newUser, newCustomer, customerCode, newTicket, conversation };
    });

    await sendNotification({
      userId: assignedAgent.userId,
      type: "TICKET_UPDATED",
      title: `New merchant assigned: ${ticketCode}`,
      body: `${businessName.trim()} completed onboarding and started a support chat.`,
      link: "/agent/conversations",
    });

    await createSession(result.newUser.id);

    return NextResponse.json({
      success: true,
      customerCode: result.customerCode,
      ticketCode: result.newTicket.ticketCode,
      conversationId: result.conversation.id,
      assignedAgentCode: assignedAgent.agentCode,
      user: {
        id: result.newUser.id,
        email: result.newUser.email,
        fullName: result.newUser.fullName,
        role: result.newUser.role,
      },
      customer: result.newCustomer,
    });
  } catch (error: any) {
    console.error("Customer onboarding error:", error);

    // If the database schema is missing tables, give the user a clear,
    // actionable message instead of the raw Postgres "Failed query".
    if (error.message?.includes("Database schema is incomplete")) {
      return NextResponse.json(
        {
          error: "Database setup is incomplete. Please run the database setup so the tables exist.",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: error.message || "Failed to complete onboarding" }, { status: 500 });
  }
}
