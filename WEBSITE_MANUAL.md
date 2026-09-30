# Website Manual

This manual describes the main user-facing workflows in the Shopify Support website. The visible controls available to each user depend on their account role and permissions.

## 1. Getting started

- Open `/` for the public overview page.
- Merchants sign in or create an account from `/start/customer`.
- Agents sign in or accept an administrator invitation from `/start/agent`.
- Administrators sign in from `/start/admin`.
- After authentication, each account is sent to its own portal: `/customer`, `/agent`, or `/admin`.

Use the portal appropriate to the account role. Portal APIs enforce role checks; a page or button being visible is not itself authorization.

## 2. Merchant portal

The merchant portal is the customer's workspace for their own store and support activity.

- **Overview (`/customer`)**: Review account and support activity.
- **Services (`/customer/services`)**: Browse active catalog services and start a service request.
- **Service requests (`/customer/service-requests`)**: Review requests and respond to proposals or quotes where available. A request/quote approval should not be assumed to represent payment unless the application explicitly presents a checkout step.
- **Tickets (`/customer/tickets`)**: Create and follow support tickets.
- **Messages (`/customer/messages`)**: Exchange messages with the assigned support team in the relevant conversation.
- **Files (`/customer/files`)**: Review files available to the account.
- **Notifications (`/customer/notifications`)**: Review updates and mark notifications as read where the control is available.
- **Settings and store (`/customer/settings`, `/customer/store`)**: Maintain profile preferences and store information.

## 3. Agent workspace

Agents work with customers and work items assigned or attached to them. Agents should only access customer records and tickets permitted by the server-side assignment checks.

- **Dashboard (`/agent`)**: Review current work and activity.
- **Customers (`/agent/customers`)**: Open assigned customer records.
- **Conversations (`/agent/conversations`)**: Reply to customer conversations and review available service recommendations.
- **Tickets (`/agent/tickets`)**: Work on tickets assigned or attached to the agent.
- **Service requests (`/agent/service-requests`)**: Review assigned service requests and the active service catalog.
- **Files (`/agent/files`)**: View files permitted for assigned customers.
- **Notifications (`/agent/notifications`)**: Review agent notifications.
- **Profile (`/agent/profile`)**: Change the display name shown in the application. This does not change the sign-in email or account role.

Agents can submit service proposals for administrator review. A proposal is not published in the customer catalog until an administrator approves and publishes it.

## 4. Administrator portal

Administrators manage platform operations and the live catalog.

- **Overview (`/admin`)**: Review operational summaries.
- **Customers (`/admin/customers`)**: Review customer accounts and their assignments.
- **Agents (`/admin/agents`)**: Invite, manage, terminate, or reassign agents and their customer relationships, subject to the controls available in the portal.
- **Tickets (`/admin/tickets`)**: Review and manage tickets across the platform, including assignment.
- **Service requests (`/admin/service-requests`)**: Review service requests and quote activity.
- **Services (`/admin/services`)**: Create and manage published catalog services, including their category, price, details, and active status.
- **Audit logs and settings (`/admin/audit-logs`, `/admin/settings`)**: Review administrative activity and application settings available to the account.

Agent-submitted service proposals require administrator review before they become live services. Only administrators should publish, deactivate, or edit the live catalog.

## 5. Service catalog categories

Services are grouped into categories such as Bug Fix, Store Operational Verification, Business Schema Markup, Store Redesign, Theme Customization, Apps & Integrations, SEO & Conversion Optimization, Store Migration & Data, and Ongoing Shopify Support. The exact active categories and offerings are managed through the administrator service controls.

The Brand Schema Tag plans in Business Schema Markup are:

- **Basic — $150**: Homepage organization/brand schema, logo and brand structured data, and validation.
- **Standard — $300**: Basic inclusions plus product schema for key products, breadcrumbs, and rich snippet testing.
- **Premium — $500**: Standard inclusions plus applicable site-wide FAQ, review, and LocalBusiness schema, monitoring/error fixing, and priority support.

Estimated delivery timing should be confirmed for the individual request when the catalog says it will be determined after store review.

## 6. Tickets, conversations, and files

- Keep each message in the conversation associated with the relevant ticket or service request so the history stays understandable.
- Access to a ticket, customer, conversation, or file depends on role and assignment; do not share private links or customer data outside the authorized portal.
- File availability and delivery depend on the file API and permissions. Do not assume that a visible file reference means the file is publicly accessible.
- Notifications link users back to relevant work where supported. Users can review notification state in their portal.

## 7. Operational notes

- The sitemap and `robots.txt` describe public crawl behavior. Authenticated portals, login/onboarding pages, and API routes are excluded from indexing.
- `llms.txt` gives AI assistants a concise, non-sensitive description of the public product and its role boundaries.
- Set `NEXT_PUBLIC_SITE_URL` (or `SITE_URL`) to the canonical deployed origin so generated sitemap and robots links use the production domain. In deployments that provide `VERCEL_URL`, that host is used as a fallback. Local development falls back to `http://localhost:3000`.
- Do not put passwords, database URLs, private keys, customer information, or other secrets in this manual or `llms.txt`.
