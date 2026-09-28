import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { internalNotes, users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { StickyNote, ShieldAlert, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgentNotesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const notesList = await db
    .select()
    .from(internalNotes)
    .orderBy(desc(internalNotes.createdAt))
    .limit(50);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-amber-400" />
            Internal Private Notes
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Internal observations, merchant tech notes, and theme liquid caveats.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/40 border border-amber-800/60 px-3 py-1.5 rounded-lg">
          <Lock className="w-3.5 h-3.5" />
          <span>Restricted: Never visible to customer</span>
        </div>
      </div>

      <div className="space-y-3">
        {notesList.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500">
            No internal notes recorded yet.
          </div>
        ) : (
          notesList.map((n) => (
            <div
              key={n.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-slate-200">{n.authorName}</span>
                <span className="text-[11px]">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed">{n.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
