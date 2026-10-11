import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { files, customers, conversations, serviceOrders } from "@/db/schema";
import { and, eq, desc, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/portal-access";
import { canAgentAccessConversation } from "@/lib/conversation-access";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
]);
const fileMetadata = {
  id: files.id,
  customerId: files.customerId,
  uploadedBy: files.uploadedBy,
  fileName: files.fileName,
  fileSize: files.fileSize,
  fileType: files.fileType,
  fileUrl: files.fileUrl,
  relatedType: files.relatedType,
  relatedId: files.relatedId,
  createdAt: files.createdAt,
};

function matchesFileSignature(type: string, bytes: Buffer): boolean {
  switch (type) {
    case "image/jpeg":
      return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "image/webp":
      return bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    case "image/gif":
      return bytes.toString("ascii", 0, 6) === "GIF87a" || bytes.toString("ascii", 0, 6) === "GIF89a";
    case "application/pdf":
      return bytes.subarray(0, 5).toString("ascii") === "%PDF-";
    case "application/zip":
    case "application/x-zip-compressed":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && [0x03, 0x05, 0x07].includes(bytes[2]) && [0x04, 0x06, 0x08].includes(bytes[3]);
    case "text/plain":
      try {
        new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        return true;
      } catch {
        return false;
      }
    default:
      return false;
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let customerFiles: any[] = [];

    if (user.role === "customer" && user.customer) {
      customerFiles = await db
        .select(fileMetadata)
        .from(files)
        .where(eq(files.customerId, user.customer.id))
        .orderBy(desc(files.createdAt));
    } else if (user.role === "agent" && user.agent) {
      const { searchParams } = new URL(request.url);
      const customerId = searchParams.get("customerId");
      if (customerId) {
        const [assignedCustomer] = await db.select({ id: customers.id }).from(customers)
          .where(and(eq(customers.id, customerId), eq(customers.assignedAgentId, user.agent.id))).limit(1);
        if (!assignedCustomer) return NextResponse.json({ error: "Access denied" }, { status: 403 });
        customerFiles = await db
          .select(fileMetadata)
          .from(files)
          .where(eq(files.customerId, customerId))
          .orderBy(desc(files.createdAt));
      } else {
        const assignedCustomers = await db.select({ id: customers.id }).from(customers).where(eq(customers.assignedAgentId, user.agent.id));
        customerFiles = assignedCustomers.length
          ? await db.select(fileMetadata).from(files).where(inArray(files.customerId, assignedCustomers.map((customer) => customer.id))).orderBy(desc(files.createdAt)).limit(100)
          : [];
      }
    } else if (isAdminRole(user.role)) {
      const { searchParams } = new URL(request.url);
      const customerId = searchParams.get("customerId");
      customerFiles = customerId
        ? await db.select(fileMetadata).from(files).where(eq(files.customerId, customerId)).orderBy(desc(files.createdAt))
        : await db.select(fileMetadata).from(files).orderBy(desc(files.createdAt)).limit(100);
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

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 15MB limit" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "This file type is not supported" }, { status: 400 });
    }
    const storageData = Buffer.from(await file.arrayBuffer());
    if (!matchesFileSignature(file.type, storageData)) {
      return NextResponse.json({ error: "The uploaded content does not match its declared file type" }, { status: 400 });
    }

    // Determine target customer
    let targetCustomerId = "";
    if (user.role === "customer" && user.customer) {
      targetCustomerId = user.customer.id;
    } else if (user.role === "agent" && user.agent) {
      const formCustId = formData.get("customerId") as string;
      if (!formCustId) {
        return NextResponse.json({ error: "Target customerId required for staff upload" }, { status: 400 });
      }
      const [assignedCustomer] = await db.select({ id: customers.id }).from(customers)
        .where(and(eq(customers.id, formCustId), eq(customers.assignedAgentId, user.agent.id))).limit(1);
      if (!assignedCustomer && relatedType !== "conversation") return NextResponse.json({ error: "Access denied" }, { status: 403 });
      targetCustomerId = formCustId;
    } else if (isAdminRole(user.role)) {
      const formCustId = formData.get("customerId") as string;
      if (!formCustId) return NextResponse.json({ error: "Target customerId required for staff upload" }, { status: 400 });
      targetCustomerId = formCustId;
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (relatedType === "conversation" && relatedId) {
      const [conversation] = await db.select().from(conversations).where(eq(conversations.id, relatedId)).limit(1);
      if (!conversation || conversation.customerId !== targetCustomerId) {
        return NextResponse.json({ error: "Conversation not found for this customer" }, { status: 404 });
      }
      if (user.role === "agent" && (!user.agent || !(await canAgentAccessConversation(user.agent.id, conversation)))) {
        return NextResponse.json({ error: "Access denied to this conversation" }, { status: 403 });
      }
    }

    if (relatedType === "service_order") {
      if (user.role !== "agent" || !user.agent || !relatedId || !file.type.startsWith("image/")) {
        return NextResponse.json({ error: "Only assigned agents can upload service-order completion images" }, { status: 403 });
      }
      const [order] = await db
        .select({ id: serviceOrders.id, customerId: serviceOrders.customerId, assignedAgentId: serviceOrders.assignedAgentId })
        .from(serviceOrders)
        .where(eq(serviceOrders.id, relatedId))
        .limit(1);
      if (!order || order.customerId !== targetCustomerId || order.assignedAgentId !== user.agent.id) {
        return NextResponse.json({ error: "Access denied to this service order" }, { status: 403 });
      }
    }

    const fileId = randomUUID();
    const fileUrl = `/api/files/${fileId}`;

    const [newFile] = await db
      .insert(files)
      .values({
        id: fileId,
        customerId: targetCustomerId,
        uploadedBy: user.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/octet-stream",
        fileUrl,
        storageData,
        relatedType,
        relatedId,
      })
      .returning();

    const { storageData: _storageData, ...fileMetadata } = newFile;
    return NextResponse.json({ success: true, file: fileMetadata });
  } catch (error: any) {
    console.error("File upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
