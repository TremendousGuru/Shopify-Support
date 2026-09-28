import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { getPortalHomeForRole, isAdminRole } from "@/lib/portal-access";
import { NotificationGate } from "@/components/shared/NotificationGate";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/start/admin");
  }

  if (!isAdminRole(user.role)) {
    redirect(getPortalHomeForRole(user.role));
  }

  return (
    <NotificationGate>
      <AdminNavigation
        user={{
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        }}
      >
        <div className="max-w-[1280px] mx-auto w-full">{children}</div>
      </AdminNavigation>
    </NotificationGate>
  );
}
