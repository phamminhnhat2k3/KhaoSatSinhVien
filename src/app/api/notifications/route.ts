import { auth } from "@/auth";
import { db } from "@/lib/db";
import { markRead } from "@/modules/notifications/service";

async function owner() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { id: true, active: true } });
  return user?.active ? user.id : null;
}

export async function GET(request: Request) {
  const userId = await owner();
  if (!userId) return Response.json({ message: "Vui lòng đăng nhập." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const page = Math.min(10000, Math.max(1, Number.parseInt(params.get("page") ?? "1",10) || 1));
  const where = { userId, ...(params.get("filter") === "unread" ? { readAt: null } : {}) };
  const [unread, items, total, latest] = await Promise.all([
    db.notification.count({ where: { userId, readAt: null } }),
    db.notification.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 20, skip: (page-1)*20, select: { id: true, title: true, body: true, href: true, createdAt: true, readAt: true } }),
    db.notification.count({ where }), db.notification.findFirst({ where: { userId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, title: true } })
  ]);
  return Response.json({ unread, items, total, latest }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  const userId = await owner();
  if (!userId) return Response.json({ message: "Vui lòng đăng nhập." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const source = new URL(origin);
      if (!["http:","https:"].includes(source.protocol) || source.host !== (request.headers.get("host") ?? new URL(request.url).host)) return Response.json({ message: "Yêu cầu không hợp lệ." }, { status: 403 });
    } catch { return Response.json({ message: "Yêu cầu không hợp lệ." }, { status: 403 }); }
  }
  const data = await request.json().catch(() => null);
  if (!data || !(data.all === true || (typeof data.id === "string" && data.id.length > 0 && data.id.length < 200))) return Response.json({ message: "Thông báo không hợp lệ." }, { status: 400 });
  const result = await markRead(db, userId, data.all === true ? undefined : data.id);
  return Response.json({ updated: result.count });
}
