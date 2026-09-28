import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notificationPreferences, pushSubscriptions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  return NextResponse.json({
    configured: Boolean(publicKey && privateKey && subject),
    publicKey: publicKey || null,
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
    return NextResponse.json({ error: "Device notifications are not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
    const p256dh = typeof body.keys?.p256dh === "string" ? body.keys.p256dh : "";
    const auth = typeof body.keys?.auth === "string" ? body.keys.auth : "";

    if (!endpoint || endpoint.length > 4096 || !p256dh || !auth) {
      return NextResponse.json({ error: "A valid device subscription is required" }, { status: 400 });
    }

    let endpointUrl: URL;
    try {
      endpointUrl = new URL(endpoint);
    } catch {
      return NextResponse.json({ error: "Invalid push endpoint" }, { status: 400 });
    }

    if (endpointUrl.protocol !== "https:") {
      return NextResponse.json({ error: "Invalid push endpoint" }, { status: 400 });
    }

    await db
      .insert(pushSubscriptions)
      .values({ userId: user.id, endpoint, p256dh, auth })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { userId: user.id, p256dh, auth, updatedAt: new Date() },
      });

    await db
      .insert(notificationPreferences)
      .values({ userId: user.id, browserPush: true })
      .onConflictDoUpdate({
        target: notificationPreferences.userId,
        set: { browserPush: true, updatedAt: new Date() },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save push subscription:", error);
    return NextResponse.json({ error: "Failed to save device subscription" }, { status: 500 });
  }
}