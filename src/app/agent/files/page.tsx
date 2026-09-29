import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { files, customers } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { FolderOpen, Download, FileText, Image as ImageIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgentFilesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const assignedCustomers = user.role === "agent" && user.agent
    ? await db.select({ id: customers.id }).from(customers).where(eq(customers.assignedAgentId, user.agent.id))
    : [];
  const filesList = assignedCustomers.length
    ? await db.select({
      id: files.id,
      customerId: files.customerId,
      fileName: files.fileName,
      fileSize: files.fileSize,
      fileType: files.fileType,
      fileUrl: files.fileUrl,
      createdAt: files.createdAt,
    }).from(files).where(inArray(files.customerId, assignedCustomers.map((customer) => customer.id))).orderBy(desc(files.createdAt)).limit(50)
    : [];

  const enriched = await Promise.all(
    filesList.map(async (f) => {
      const [c] = await db
        .select({ businessName: customers.businessName, customerCode: customers.customerCode })
        .from(customers)
        .where(eq(customers.id, f.customerId))
        .limit(1);
      return { ...f, customer: c };
    })
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-blue-400" />
          Customer Files & Theme Assets
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Access screenshots, bug recordings, and documents uploaded by assigned merchants.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl divide-y divide-slate-800">
        {enriched.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No files uploaded yet.</div>
        ) : (
          enriched.map((file) => (
            <div key={file.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400 shrink-0">
                  {file.fileType.startsWith("image/") ? (
                    <ImageIcon className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{file.fileName}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="text-emerald-400 font-semibold">
                      {file.customer?.businessName || "Merchant"} ({file.customer?.customerCode})
                    </span>
                    <span>•</span>
                    <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <a
                href={file.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
