import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { agents, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (user.role !== "agent" || !user.agent) {
    return NextResponse.json({ error: "Only agents can update an agent display name" }, { status: 403 });
  }

  let displayName: unknown;
  let specialties: unknown;
  try {
    ({ displayName, specialties } = await request.json());
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

  let updatedSpecialties = user.agent.specialties ?? "";
  if (specialties !== undefined) {
    if (typeof specialties !== "string" || specialties.length > 800 || /[\u0000-\u001f\u007f]/.test(specialties)) {
      return NextResponse.json({ error: "Specialities must be a comma-separated list of up to 12 items" }, { status: 400 });
    }
    const normalized = specialties.split(",").map((item) => item.trim()).filter(Boolean);
    const unique = [...new Map(normalized.map((item) => [item.toLocaleLowerCase(), item])).values()];
    if (unique.length > 12 || unique.some((item) => item.length > 60)) {
      return NextResponse.json({ error: "Add up to 12 specialities, each 60 characters or fewer" }, { status: 400 });
    }
    updatedSpecialties = unique.join(", ");
  }

  const [updated] = await db.update(users).set({ fullName, updatedAt: new Date() })
    .where(eq(users.id, user.id)).returning({ fullName: users.fullName });
  if (!updated) return NextResponse.json({ error: "Could not update display name" }, { status: 500 });

  if (specialties !== undefined) {
    const [updatedAgent] = await db.update(agents).set({ specialties: updatedSpecialties })
      .where(eq(agents.id, user.agent.id)).returning({ specialties: agents.specialties });
    if (!updatedAgent) return NextResponse.json({ error: "Could not update specialities" }, { status: 500 });
    updatedSpecialties = updatedAgent.specialties ?? "";
  }
  return NextResponse.json({ displayName: updated.fullName, specialties: updatedSpecialties });
}
