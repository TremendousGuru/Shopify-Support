import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { FileCheck2, Shield, Lock, Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-purple-400" />
            Security & Compliance Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically timestamped audit records of administrative access, invitation grants, and customer conversation reviews.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-purple-950/40 border border-purple-800 px-3 py-1.5 rounded-lg text-xs text-purple-300">
          <Lock className="w-4 h-4 text-purple-400" />
          <span>Immutable Audit Log</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Actor</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Customer / Target</th>
                <th className="p-3.5">Justification / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="p-3.5 whitespace-nowrap text-slate-400 text-[11px] font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-bold text-white">{log.actorName}</div>
                      <div className="text-[10px] text-purple-400 capitalize">
                        {log.actorRole.replace("_", " ")}
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-mono text-[10px] bg-slate-800 text-purple-300 px-2 py-0.5 rounded font-bold border border-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {log.customerCode ? (
                        <span className="font-mono text-emerald-400 font-bold">
                          {log.customerCode}
                        </span>
                      ) : (
                        <span className="text-slate-500">{log.targetType}</span>
                      )}
                    </td>
                    <td className="p-3.5 max-w-sm">
                      <p className="text-slate-300 text-xs leading-relaxed">{log.reason}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
