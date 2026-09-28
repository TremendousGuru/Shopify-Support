import { NextResponse } from "next/server";
import { db } from "@/db";
import { notificationPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, user.id))
      .limit(1);

    if (!prefs) {
      [prefs] = await db
        .insert(notificationPreferences)
        .values({
          userId: user.id,
          supportInbox: true,
          emailSupport: true,
          browserPush: true,
          whatsappSupport: false,
          marketingEmails: false,
          promotionalOffers: false,
        })
        .returning();
    }

    return NextResponse.json({ preferences: prefs });
  } catch (error: any) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
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
      supportInbox,
      emailSupport,
      browserPush,
      whatsappSupport,
      marketingEmails,
      promotionalOffers,
    } = body;

    const [updated] = await db
      .update(notificationPreferences)
      .set({
        ...(supportInbox !== undefined && { supportInbox }),
        ...(emailSupport !== undefined && { emailSupport }),
        ...(browserPush !== undefined && { browserPush: true }),
        ...(whatsappSupport !== undefined && { whatsappSupport }),
        ...(marketingEmails !== undefined && { marketingEmails }),
        ...(promotionalOffers !== undefined && { promotionalOffers }),
        updatedAt: new Date(),
      })
      .where(eq(notificationPreferences.userId, user.id))
      .returning();

    return NextResponse.json({ success: true, preferences: updated });
  } catch (error: any) {
    console.error("Error updating preferences:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
