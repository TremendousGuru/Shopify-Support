import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CustomerNavigation } from "@/components/customer/CustomerNavigation";
import { getUserUnreadNotificationsCount } from "@/lib/notifications";
import { getPortalHomeForRole } from "@/lib/portal-access";
import { NotificationGate } from "@/components/shared/NotificationGate";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/start/customer");
  }

  if (user.role !== "customer") {
    redirect(getPortalHomeForRole(user.role));
  }

  const unreadCount = await getUserUnreadNotificationsCount(user.id);

  const customerData = user.customer || {
    customerCode: "SHOP-CUST-DEMO",
    businessName: user.fullName + "'s Store",
    supportStatus: "Activated",
    websiteUrl: "https://demo-store.myshopify.com",
  };

  return (
    <NotificationGate>
      <CustomerNavigation
        user={{
          fullName: user.fullName,
          email: user.email,
          customer: customerData,
          unreadNotificationsCount: unreadCount,
        }}
      >
        {children}
      </CustomerNavigation>
    </NotificationGate>
  );
}
