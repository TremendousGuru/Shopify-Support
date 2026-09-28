import { NextResponse } from "next/server";
import { db } from "@/db";
import { files, customers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let customerFiles: any[] = [];

    if (user.role === "customer" && user.customer) {
      customerFiles = await db
        .select()
        .from(files)
        .where(eq(files.customerId, user.customer.id))
        .orderBy(desc(files.createdAt));
    } else if (["agent", "system_admin", "support_supervisor"].includes(user.role)) {
      const { searchParams } = new URL(request.url);
      const customerId = searchParams.get("customerId");
      if (customerId) {
        customerFiles = await db
          .select()
          .from(files)
          .where(eq(files.customerId, customerId))
          .orderBy(desc(files.createdAt));
      } else {
        customerFiles = await db.select().from(files).orderBy(desc(files.createdAt)).limit(100);
      }
    }

    return NextResponse.json({ files: customerFiles });
  } catch (error: any) {
    console.error("Error fetching files:", error);
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const relatedType = (formData.get("relatedType") as string) || "general";
    const relatedId = (formData.get("relatedId") as string) || null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Limit size to 15MB
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 15MB limit" }, { status: 400 });
    }

    // Determine target customer
    let targetCustomerId = "";
    if (user.role === "customer" && user.customer) {
      targetCustomerId = user.customer.id;
    } else {
      const formCustId = formData.get("customerId") as string;
      if (!formCustId) {
        return NextResponse.json({ error: "Target customerId required for staff upload" }, { status: 400 });
      }
      targetCustomerId = formCustId;
    }

    // Create a mock secure URL / data reference
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileUrl = `/uploads/${timestamp}-${safeName}`;

    const [newFile] = await db
      .insert(files)
      .values({
        customerId: targetCustomerId,
        uploadedBy: user.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/octet-stream",
        fileUrl,
        relatedType,
        relatedId,
      })
      .returning();

    return NextResponse.json({ success: true, file: newFile });
  } catch (error: any) {
    console.error("File upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
