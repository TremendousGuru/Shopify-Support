import { db } from "@/db";
import { notifications, notificationPreferences, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendWebPush } from "@/lib/web-push";

export interface SendNotificationParams {
  userId: string;
  type:
    | "NEW_MESSAGE"
    | "TICKET_UPDATED"
    | "SERVICE_REQUEST_UPDATED"
    | "SERVICE_REQUEST_MESSAGE"
    | "ASSIGNMENT"
    | "QUOTE_AVAILABLE"
    | "SYSTEM_NOTIFICATION"
    | "SECURITY_NOTIFICATION";
  title: string;
  body: string;
  link?: string;
  channel?: "IN_APP" | "EMAIL" | "BROWSER_PUSH";
}

export async function sendNotification(params: SendNotificationParams) {
  try {
    // 1. Fetch user preferences
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, params.userId))
      .limit(1);

    // 2. Fetch user email
    const [user] = await db
      .select({ email: users.email, fullName: users.fullName })
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1);

    // In-app notification creation
    if (!prefs || prefs.supportInbox) {
      await db.insert(notifications).values({
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        link: params.link || null,
        channel: "IN_APP",
        isRead: false,
      });
    }

    // Email dispatch simulation / logger if enabled
    if (prefs?.emailSupport && user) {
      console.log(
        `[Email Notification Dispatched] To: ${user.email} (${user.fullName}) | Subject: ${params.title} | Link: ${params.link || "N/A"}`
      );
    }

    await sendWebPush(params.userId, {
      title: params.title,
      body: params.body,
      link: params.link || "/customer",
    });

    return true;
  } catch (err) {
    console.error("Failed to send notification:", err);
    return false;
  }
}

export async function getUserUnreadNotificationsCount(userId: string): Promise<number> {
  const list = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return list.length;
}
