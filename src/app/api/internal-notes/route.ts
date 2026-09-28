import { NextResponse } from "next/server";
import { db } from "@/db";
import { internalNotes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "customer") {
      return NextResponse.json({ error: "Forbidden: Customer cannot access internal notes" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get("targetType");
    const targetId = searchParams.get("targetId");

    if (!targetType || !targetId) {
      return NextResponse.json({ error: "Missing targetType or targetId" }, { status: 400 });
    }

    const notes = await db
      .select()
      .from(internalNotes)
      .where(eq(internalNotes.targetId, targetId))
      .orderBy(desc(internalNotes.createdAt));

    return NextResponse.json({ notes });
  } catch (error: any) {
    console.error("Error fetching internal notes:", error);
    return NextResponse.json({ error: "Failed to fetch internal notes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "customer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { targetType, targetId, content } = body;

    if (!targetType || !targetId || !content?.trim()) {
      return NextResponse.json({ error: "targetType, targetId and content are required" }, { status: 400 });
    }

    const [note] = await db
      .insert(internalNotes)
      .values({
        authorId: user.id,
        authorName: user.fullName,
        targetType,
        targetId,
        content: content.trim(),
      })
      .returning();

    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    console.error("Error creating internal note:", error);
    return NextResponse.json({ error: "Failed to create internal note" }, { status: 500 });
  }
}
