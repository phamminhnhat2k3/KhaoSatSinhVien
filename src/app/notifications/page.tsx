import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { roleLabels } from "@/modules/profile/rules";
import { readAllNotifications, readNotification } from "./actions";

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ filter?: string; page?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const unreadOnly = params.filter === "unread";
  const page = Math.min(10000, Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1));
  const where = { userId: user.id, ...(unreadOnly ? { readAt: null } : {}) };
  const [items, total, unread] = await Promise.all([db.notification.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 20, skip: (page - 1) * 20 }), db.notification.count({ where }), db.notification.count({ where: { userId: user.id, readAt: null } })]);
  const query = unreadOnly ? "filter=unread&" : "";
  return <AppShell name={user.name} role={user.roles.map(r => roleLabels[r]).join(" · ")} wide><p className="eyebrow">Cập nhật hoạt động</p><div className="section-heading"><div><h1>Thông báo</h1><p className="muted">{unread} thông báo chưa đọc</p></div><form action={readAllNotifications}><button className="button secondary" disabled={!unread}>Đánh dấu tất cả đã đọc</button></form></div><nav className="actions notification-filters" aria-label="Lọc thông báo"><Link className={`button ${unreadOnly ? "secondary" : ""}`} href="/notifications" aria-current={!unreadOnly ? "page" : undefined}>Tất cả</Link><Link className={`button ${unreadOnly ? "" : "secondary"}`} href="/notifications?filter=unread" aria-current={unreadOnly ? "page" : undefined}>Chưa đọc ({unread})</Link></nav><div className="stack">{!items.length && <section className="card empty-state"><h2>{unreadOnly ? "Bạn đã đọc hết thông báo" : "Chưa có thông báo"}</h2><p className="muted">Thông báo sẽ xuất hiện khi có đợt khảo sát được công bố, đóng hoặc khi bạn đổi mật khẩu.</p></section>}{items.map(n => <article className={`card notification-item ${n.readAt ? "" : "notification-unread"}`} key={n.id}><div className="section-heading"><h2>{n.title}</h2><span className="pill">{n.readAt ? "Đã đọc" : "Chưa đọc"}</span></div><p>{n.body}</p><p className="muted"><time dateTime={n.createdAt.toISOString()}>{n.createdAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</time></p><div className="actions"><Link className="text-button" href={n.href}>Xem chi tiết →</Link>{!n.readAt && <form action={readNotification}><input type="hidden" name="id" value={n.id}/><button className="icon-button">Đánh dấu đã đọc</button></form>}</div></article>)}</div><nav aria-label="Phân trang thông báo" className="section-heading">{page > 1 && <Link className="text-button" href={`/notifications?${query}page=${page - 1}`}>← Trang trước</Link>}<span className="muted">Trang {page} · {total} thông báo</span>{page * 20 < total && <Link className="text-button" href={`/notifications?${query}page=${page + 1}`}>Trang sau →</Link>}</nav></AppShell>;
}
