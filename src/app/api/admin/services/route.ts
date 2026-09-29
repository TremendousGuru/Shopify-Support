import { NextResponse } from "next/server";
import { db } from "@/db";
import { serviceCategories, services } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { getServiceCategories } from "@/lib/service-categories";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !["system_admin", "support_supervisor", "data_privacy_admin"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const categories = await getServiceCategories();
  const allServices = await db.select().from(services).orderBy(asc(services.displayOrder));

  return NextResponse.json({
    categories: categories.map((category) => ({
      ...category,
      services: allServices.filter((service) => service.categoryId === category.id),
    })),
    services: allServices,
    canManage: user.role === "system_admin",
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "system_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { categoryId, name, shortDescription, fullDescription, startingPrice, estimatedDays, features } = body;

  if (!categoryId || !name?.trim() || !shortDescription?.trim()) {
    return NextResponse.json({ error: "Category, name, and short description are required" }, { status: 400 });
  }

  const price = Number(startingPrice);
  if (!Number.isFinite(price) || price < 0 || !Number.isInteger(price)) {
    return NextResponse.json({ error: "Starting price must be a non-negative whole number" }, { status: 400 });
  }
  const [category] = await db.select({ id: serviceCategories.id }).from(serviceCategories).where(eq(serviceCategories.id, categoryId)).limit(1);
  if (!category) return NextResponse.json({ error: "Choose a valid service category" }, { status: 400 });

  const [created] = await db
    .insert(services)
    .values({
      categoryId,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      name,
      shortDescription,
      fullDescription: fullDescription || shortDescription,
      startingPrice: price,
      estimatedDays: estimatedDays || "2-4 days",
      features: features ? JSON.stringify(features.split(",").map((item: string) => item.trim()).filter(Boolean)) : JSON.stringify([]),
      isActive: true,
      displayOrder: 999,
    })
    .returning();

  return NextResponse.json({ success: true, service: created });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "system_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { serviceId, ...updates } = body;

  if (!serviceId) {
    return NextResponse.json({ error: "serviceId is required" }, { status: 400 });
  }

  const safeUpdates: Record<string, any> = {};

  if (updates.categoryId) safeUpdates.categoryId = updates.categoryId;
  if (updates.name) safeUpdates.name = updates.name;
  if (updates.shortDescription) safeUpdates.shortDescription = updates.shortDescription;
  if (updates.fullDescription) safeUpdates.fullDescription = updates.fullDescription;
  if (typeof updates.startingPrice === "number") safeUpdates.startingPrice = updates.startingPrice;
  if (updates.estimatedDays) safeUpdates.estimatedDays = updates.estimatedDays;
  if (typeof updates.isActive === "boolean") safeUpdates.isActive = updates.isActive;
  if (typeof updates.features !== "undefined") {
    safeUpdates.features = JSON.stringify(
      String(updates.features)
        .split(",")
        .map((item: string) => item.trim())
        .filter(Boolean)
    );
  }

  const [updated] = await db
    .update(services)
    .set({
      ...safeUpdates,
    })
    .where(eq(services.id, serviceId))
    .returning();

  return NextResponse.json({ success: true, service: updated });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "system_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("serviceId");

  if (!serviceId) {
    return NextResponse.json({ error: "serviceId is required" }, { status: 400 });
  }

  await db.update(services).set({ isActive: false }).where(eq(services.id, serviceId));
  return NextResponse.json({ success: true });
}
