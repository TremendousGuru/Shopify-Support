import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations, customers, files } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/portal-access";
import { canAgentAccessConversation } from "@/lib/conversation-access";

export async function GET(_request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { fileId } = await params;
    const [file] = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
    if (!file || !file.storageData) return NextResponse.json({ error: "File not found" }, { status: 404 });

    const [customer] = await db.select().from(customers).where(eq(customers.id, file.customerId)).limit(1);
    const ownsFile = user.role === "customer" && customer?.userId === user.id;
    let assignedAgent = user.role === "agent" && customer?.assignedAgentId === user.agent?.id;
    if (!assignedAgent && user.role === "agent" && user.agent && file.relatedType === "conversation" && file.relatedId) {
      const [conversation] = await db.select().from(conversations).where(eq(conversations.id, file.relatedId)).limit(1);
      assignedAgent = !!conversation && await canAgentAccessConversation(user.agent.id, conversation);
    }
    if (!ownsFile && !assignedAgent && !isAdminRole(user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const disposition = file.fileType.startsWith("image/") || file.fileType === "application/pdf" ? "inline" : "attachment";
    return new Response(new Uint8Array(file.storageData), {
      headers: {
        "Content-Type": file.fileType,
        "Content-Length": String(file.fileSize),
        "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}