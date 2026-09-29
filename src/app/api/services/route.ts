import { NextResponse } from "next/server";
import { db } from "@/db";
import { serviceCategories, services } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { getServiceCategories } from "@/lib/service-categories";

export async function GET() {
  try {
    const categories = await getServiceCategories();

    const allServices = await db
      .select()
      .from(services)
      .where(eq(services.isActive, true))
      .orderBy(asc(services.displayOrder));

    // Group services by category
    const grouped = categories.map((cat) => ({
      ...cat,
      services: allServices.filter((s) => s.categoryId === cat.id),
    }));

    return NextResponse.json({
      categories: grouped,
      totalServices: allServices.length,
    });
  } catch (error: any) {
    console.error("Error fetching services:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}
