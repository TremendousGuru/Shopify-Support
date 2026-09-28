import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AgentNavigation } from "@/components/agent/AgentNavigation";
import { getUserUnreadNotificationsCount } from "@/lib/notifications";
import { getPortalHomeForRole } from "@/lib/portal-access";
import { NotificationGate } from "@/components/shared/NotificationGate";

export const dynamic = "force-dynamic";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/start/agent");
  }

  if (user.role !== "agent") {
    redirect(getPortalHomeForRole(user.role));
  }

  const unreadCount = await getUserUnreadNotificationsCount(user.id);

  const agentData = user.agent || {
    agentCode: "SHOP-AGENT-001",
    department: "Merchant Success & Store Architecture",
    status: "Available",
  };

  return (
    <NotificationGate>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <div className="flex flex-1">
          <AgentNavigation
            user={{
              fullName: user.fullName,
              email: user.email,
              agent: agentData,
              unreadNotificationsCount: unreadCount,
            }}
          />
          <main className="flex-1 pb-20 md:pb-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </NotificationGate>
  );
}
