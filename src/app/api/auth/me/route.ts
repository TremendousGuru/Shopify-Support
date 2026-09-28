import { NextResponse } from "next/server";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { getUserUnreadNotificationsCount } from "@/lib/notifications";

export async function POST() {
  await destroySession();
  return NextResponse.json({ success: true, message: "Logged out successfully" });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const unreadCount = await getUserUnreadNotificationsCount(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      customer: user.customer,
      agent: user.agent,
      unreadNotificationsCount: unreadCount,
    },
  });
}
