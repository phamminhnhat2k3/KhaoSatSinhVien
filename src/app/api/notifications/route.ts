import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ message: "Vui lòng đăng nhập." }, { status: 401 });
  const unread = await db.notification.count({ where: { userId: session.user.id, readAt: null } });
  return Response.json({ unread }, { headers: { "Cache-Control": "private, no-store" } });
}
