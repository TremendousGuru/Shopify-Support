import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (user.role !== "agent" || !user.agent) {
    return NextResponse.json({ error: "Only agents can update an agent display name" }, { status: 403 });
  }

  let displayName: unknown;
  try {
    ({ displayName } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof displayName !== "string") {
    return NextResponse.json({ error: "Enter a display name" }, { status: 400 });
  }
  const fullName = displayName.trim().replace(/\s+/g, " ");
  if (fullName.length < 2 || fullName.length > 60 || /[\u0000-\u001f\u007f]/.test(fullName)) {
    return NextResponse.json({ error: "Display name must be 2–60 characters" }, { status: 400 });
  }

  const [updated] = await db.update(users).set({ fullName, updatedAt: new Date() })
    .where(eq(users.id, user.id)).returning({ fullName: users.fullName });
  if (!updated) return NextResponse.json({ error: "Could not update display name" }, { status: 500 });
  return NextResponse.json({ displayName: updated.fullName });
}
