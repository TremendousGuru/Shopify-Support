import { NextResponse } from "next/server";
import { db } from "@/db";
import { serviceCategories, serviceProposals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "agent" || !user.agent) {
      return NextResponse.json({ error: "Agent access required" }, { status: 403 });
    }

    const body = await request.json();
    const { categoryId, name, shortDescription, fullDescription, startingPrice, estimatedDays, features } = body;
    if (!categoryId || !name?.trim() || !shortDescription?.trim() || !fullDescription?.trim()) {
      return NextResponse.json({ error: "Category, name, short description, and full description are required" }, { status: 400 });
    }
    const price = Number(startingPrice);
    if (!Number.isInteger(price) || price < 0) {
      return NextResponse.json({ error: "Starting price must be a non-negative whole number" }, { status: 400 });
    }
    const [category] = await db.select({ id: serviceCategories.id }).from(serviceCategories).where(eq(serviceCategories.id, categoryId)).limit(1);
    if (!category) return NextResponse.json({ error: "Choose a valid service category" }, { status: 400 });

    const normalizedFeatures = Array.isArray(features) ? features : String(features || "").split(",").map((item: string) => item.trim()).filter(Boolean);
    const [proposal] = await db.insert(serviceProposals).values({
      submittedByAgentId: user.agent.id,
      categoryId,
      name: name.trim(),
      shortDescription: shortDescription.trim(),
      fullDescription: fullDescription.trim(),
      startingPrice: price,
      estimatedDays: String(estimatedDays || "To be determined").trim(),
      features: JSON.stringify(normalizedFeatures),
    }).returning();

    return NextResponse.json({ success: true, proposal });
  } catch (error) {
    console.error("Error submitting service proposal:", error);
    return NextResponse.json({ error: "Failed to submit service proposal" }, { status: 500 });
  }
}