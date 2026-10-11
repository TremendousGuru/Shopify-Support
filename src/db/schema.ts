import { customType, pgTable, uuid, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

// 1. Users Table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role: text("role").notNull().default("customer"), // 'customer', 'agent', 'system_admin', 'support_supervisor', 'data_privacy_admin'
  fullName: text("full_name").notNull(),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  isActive: boolean("is_active").default(true).notNull(),
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. Customers Table
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  customerCode: text("customer_code").notNull().unique(), // e.g. SHOP-CUST-482193
  businessName: text("business_name").notNull(),
  websiteUrl: text("website_url"),
  ecommercePlatform: text("ecommerce_platform").notNull().default("Shopify"),
  storeCategory: text("store_category"),
  businessStage: text("business_stage"),
  primaryGoals: text("primary_goals"),
  supportStatus: text("support_status").notNull().default("Activated"), // 'Issued', 'Activated', 'Suspended', 'Archived'
  assignedAgentId: uuid("assigned_agent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3. Stores Table
export const stores = pgTable("stores", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  storeName: text("store_name").notNull(),
  storeUrl: text("store_url"),
  platform: text("platform").notNull().default("Shopify"),
  niche: text("niche"),
  approxMonthlyOrders: text("approx_monthly_orders"),
  isPrimary: boolean("is_primary").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Agents Table
export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  agentCode: text("agent_code").notNull().unique(), // e.g. SHOP-AGENT-001
  department: text("department").notNull().default("Merchant Success & Store Architecture"),
  specialties: text("specialties").default("Shopify Themes, CRO, SEO, Store Optimization"),
  status: text("status").notNull().default("Available"), // 'Available', 'Busy', 'Away', 'Offline'
  maxAssignedCustomers: integer("max_assigned_customers").default(25).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Agent Invitations Table
export const agentInvitations = pgTable("agent_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  role: text("role").notNull().default("agent"),
  department: text("department").default("Merchant Support"),
  invitedBy: uuid("invited_by").references(() => users.id),
  token: text("token").notNull().unique(),
  status: text("status").notNull().default("pending"), // 'pending', 'accepted', 'expired', 'revoked'
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Service Categories Table
export const serviceCategories = pgTable("service_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  displayOrder: integer("display_order").default(0).notNull(),
});

// 7. Services Catalog Table
export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").references(() => serviceCategories.id).notNull(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  shortDescription: text("short_description"),
  fullDescription: text("full_description"),
  startingPrice: integer("starting_price"),
  estimatedDays: text("estimated_days"),
  features: text("features"), // JSON array of string features
  isActive: boolean("is_active").default(true).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
});

export const serviceProposals = pgTable("service_proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  submittedByAgentId: uuid("submitted_by_agent_id").references(() => agents.id).notNull(),
  categoryId: uuid("category_id").references(() => serviceCategories.id).notNull(),
  name: text("name").notNull(),
  shortDescription: text("short_description").notNull(),
  fullDescription: text("full_description").notNull(),
  startingPrice: integer("starting_price").notNull(),
  estimatedDays: text("estimated_days").notNull(),
  features: text("features").notNull().default("[]"),
  status: text("status").notNull().default("pending"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewNote: text("review_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 8. Service Requests Table
export const serviceRequests = pgTable("service_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestCode: text("request_code").notNull().unique(), // e.g. REQ-2026-0042
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  serviceId: uuid("service_id").references(() => services.id).notNull(),
  status: text("status").notNull().default("Submitted"),
  // 'Submitted', 'Under Review', 'Needs Information', 'Quoted', 'Approved', 'In Progress', 'Quality Review', 'Completed', 'Closed', 'Cancelled'
  storeUrl: text("store_url"),
  description: text("description").notNull(),
  goals: text("goals"),
  desiredTimeframe: text("desired_timeframe"),
  assignedAgentId: uuid("assigned_agent_id").references(() => agents.id),
  quotePrice: integer("quote_price"),
  quoteTimeline: text("quote_timeline"),
  quoteTerms: text("quote_terms"),
  quoteStatus: text("quote_status"), // 'Draft', 'Sent', 'Accepted', 'Declined'
  quoteExpiresAt: timestamp("quote_expires_at"),
  quoteBillingInterval: text("quote_billing_interval"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const serviceOrders = pgTable("service_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderCode: text("order_code").notNull().unique(),
  serviceRequestId: uuid("service_request_id").references(() => serviceRequests.id, { onDelete: "cascade" }).notNull().unique(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  serviceId: uuid("service_id").references(() => services.id).notNull(),
  assignedAgentId: uuid("assigned_agent_id").references(() => agents.id),
  serviceName: text("service_name").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("Awaiting Payment"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  amountPaid: integer("amount_paid").default(0).notNull(),
  paymentReportedAt: timestamp("payment_reported_at"),
  paymentReportedAmount: integer("payment_reported_amount"),
  paymentConfirmedAt: timestamp("payment_confirmed_at"),
  paymentConfirmedBy: uuid("payment_confirmed_by").references(() => users.id),
  workStartedAt: timestamp("work_started_at"),
  deliveryDueAt: timestamp("delivery_due_at"),
  completionFileId: uuid("completion_file_id"),
  customerReviewNote: text("customer_review_note"),
  customerSatisfiedAt: timestamp("customer_satisfied_at"),
  recurringInterval: text("recurring_interval"),
  nextPaymentDueAt: timestamp("next_payment_due_at"),
  lastRecurringReminderAt: timestamp("last_recurring_reminder_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 9. Support Tickets Table
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketCode: text("ticket_code").notNull().unique(), // e.g. TKT-8921
  externalTicketReference: text("external_ticket_reference"),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("Shopify Store Support"),
  priority: text("priority").notNull().default("Normal"), // 'Low', 'Normal', 'High', 'Urgent'
  status: text("status").notNull().default("Open"), // 'Open', 'In Progress', 'Waiting for Customer', 'Resolved', 'Closed'
  assignedAgentId: uuid("assigned_agent_id").references(() => agents.id),
  serviceRequestId: uuid("service_request_id").references(() => serviceRequests.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 10. Conversations Table
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull().default("support"), // 'support', 'ticket', 'service_request'
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  ticketId: uuid("ticket_id").references(() => tickets.id),
  serviceRequestId: uuid("service_request_id").references(() => serviceRequests.id),
  assignedAgentId: uuid("assigned_agent_id").references(() => agents.id),
  subject: text("subject").notNull().default("General Support Chat"),
  isSensitive: boolean("is_sensitive").default(true).notNull(),
  status: text("status").notNull().default("active"), // 'active', 'archived', 'closed'
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 11. Messages Table
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  serviceRequestId: uuid("service_request_id").references(() => serviceRequests.id, { onDelete: "set null" }),
  senderId: uuid("sender_id").references(() => users.id).notNull(),
  senderRole: text("sender_role").notNull(), // 'customer', 'agent', 'admin'
  senderName: text("sender_name").notNull(),
  content: text("content").notNull(),
  isInternalNote: boolean("is_internal_note").default(false).notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  attachments: text("attachments"), // JSON stringified array of attachments
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 12. Internal Notes Table (never visible to customers)
export const internalNotes = pgTable("internal_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id").references(() => users.id).notNull(),
  authorName: text("author_name").notNull(),
  targetType: text("target_type").notNull(), // 'customer', 'ticket', 'service_request'
  targetId: text("target_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 13. Files Table
export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  uploadedBy: uuid("uploaded_by").references(() => users.id).notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: text("file_type").notNull(),
  fileUrl: text("file_url").notNull(),
  storageData: bytea("storage_data"),
  relatedType: text("related_type"), // 'ticket', 'service_request', 'conversation', 'store'
  relatedId: text("related_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 14. Notifications Table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // 'NEW_MESSAGE', 'TICKET_UPDATED', 'SERVICE_REQUEST_UPDATED', 'ASSIGNMENT', 'QUOTE_AVAILABLE', 'SYSTEM_NOTIFICATION', 'SECURITY_NOTIFICATION'
  title: text("title").notNull(),
  body: text("body").notNull(),
  link: text("link"),
  isRead: boolean("is_read").default(false).notNull(),
  channel: text("channel").default("IN_APP").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 15. Notification Preferences Table
export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  supportInbox: boolean("support_inbox").default(true).notNull(),
  emailSupport: boolean("email_support").default(true).notNull(),
  browserPush: boolean("browser_push").default(true).notNull(),
  whatsappSupport: boolean("whatsapp_support").default(false).notNull(),
  marketingEmails: boolean("marketing_emails").default(false).notNull(),
  promotionalOffers: boolean("promotional_offers").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 16. Consent Records Table
export const consentRecords = pgTable("consent_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  termsAccepted: boolean("terms_accepted").default(true).notNull(),
  privacyPolicyAccepted: boolean("privacy_policy_accepted").default(true).notNull(),
  supportPolicyAccepted: boolean("support_policy_accepted").default(true).notNull(),
  marketingConsent: boolean("marketing_consent").default(false).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  acceptedAt: timestamp("accepted_at").defaultNow().notNull(),
});

// 17. Audit Logs Table (Admin & sensitive access tracking)
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => users.id).notNull(),
  actorRole: text("actor_role").notNull(),
  actorName: text("actor_name").notNull(),
  action: text("action").notNull(), // 'VIEW_SENSITIVE_CONVERSATION', 'CHANGE_ROLE', 'INVITE_AGENT', 'REVOKE_INVITATION', 'REASSIGN_REQUEST', etc.
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  customerCode: text("customer_code"),
  reason: text("reason"),
  metadata: text("metadata"), // JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 18. Sessions Table
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionToken: text("session_token").notNull().unique(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  customer: one(customers, {
    fields: [users.id],
    references: [customers.userId],
  }),
  agent: one(agents, {
    fields: [users.id],
    references: [agents.userId],
  }),
  notifications: many(notifications),
  pushSubscriptions: many(pushSubscriptions),
  notificationPreferences: one(notificationPreferences, {
    fields: [users.id],
    references: [notificationPreferences.userId],
  }),
  sessions: many(sessions),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, {
    fields: [customers.userId],
    references: [users.id],
  }),
  stores: many(stores),
  serviceRequests: many(serviceRequests),
  tickets: many(tickets),
  conversations: many(conversations),
  files: many(files),
  assignedAgent: one(agents, {
    fields: [customers.assignedAgentId],
    references: [agents.id],
  }),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  user: one(users, {
    fields: [agents.userId],
    references: [users.id],
  }),
  assignedCustomers: many(customers),
  assignedTickets: many(tickets),
  assignedServiceRequests: many(serviceRequests),
}));

export const serviceRequestsRelations = relations(serviceRequests, ({ one, many }) => ({
  customer: one(customers, {
    fields: [serviceRequests.customerId],
    references: [customers.id],
  }),
  service: one(services, {
    fields: [serviceRequests.serviceId],
    references: [services.id],
  }),
  assignedAgent: one(agents, {
    fields: [serviceRequests.assignedAgentId],
    references: [agents.id],
  }),
  conversations: many(conversations),
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  customer: one(customers, {
    fields: [tickets.customerId],
    references: [customers.id],
  }),
  assignedAgent: one(agents, {
    fields: [tickets.assignedAgentId],
    references: [agents.id],
  }),
  serviceRequest: one(serviceRequests, {
    fields: [tickets.serviceRequestId],
    references: [serviceRequests.id],
  }),
  conversations: many(conversations),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  customer: one(customers, {
    fields: [conversations.customerId],
    references: [customers.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));
