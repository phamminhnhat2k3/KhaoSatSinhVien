"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Notice = { id: string; title: string; body: string; href: string; createdAt: string; readAt: string | null };
type Result = { unread: number; items: Notice[]; total: number; latest: { id: string; title: string } | null };
export function NotificationShortcut() {
  return <button className="text-button notification-trigger" type="button" onClick={() => window.dispatchEvent(new Event("open-notifications"))}>Thông báo</button>;
}

export function NotificationLink() {
  const [data, setData] = useState<Result>({ unread: 0, items: [], total: 0, latest: null });
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const latest = useRef<string | null | undefined>(undefined);
  const sequence = useRef(0);
  const router = useRouter();
  const path = usePathname();
  const load = useCallback(async (announce = false) => {
    const request = ++sequence.current;
    try {
      const response = await fetch(`/api/notifications?page=${page}${unreadOnly ? "&filter=unread" : ""}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Không tải được thông báo. Vui lòng thử lại.");
      const next: Result = await response.json();
      if (request !== sequence.current) return;
      if (announce && latest.current !== undefined && next.latest && next.latest.id !== latest.current) setToast(next.latest.title);
      latest.current = next.latest?.id ?? null;
      setData(next); setError("");
    } catch { if (request === sequence.current) setError("Không tải được thông báo. Vui lòng thử lại."); }
  }, [page, unreadOnly]);
  useEffect(() => {
    const refresh = () => { void load(true); };
    void load();
    const timer = setInterval(() => { if (!document.hidden) refresh(); }, 15000);
    window.addEventListener("focus", refresh);
    return () => { sequence.current++; clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [path, load]);
  useEffect(() => {
    const show = () => { setOpen(true); setToast(null); };
    window.addEventListener("open-notifications", show);
    if (new URLSearchParams(window.location.search).get("notifications") === "1") show();
    return () => window.removeEventListener("open-notifications", show);
  }, []);
  useEffect(() => {
    if (open) { dialog.current?.showModal(); void load(); }
    else dialog.current?.close();
  }, [open, load]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 6000); return () => clearTimeout(timer); }, [toast]);
  async function read(id?: string) {
    setBusy(true);
    try {
      const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(id ? { id } : { all: true }) });
      if (!response.ok) throw new Error();
      await load(); return true;
    } catch { setError("Chưa đánh dấu đọc được. Vui lòng thử lại."); return false; }
    finally { setBusy(false); }
  }
  async function visit(n: Notice) { if (!n.readAt && !(await read(n.id))) return; setOpen(false); router.push(n.href.startsWith("/") && !n.href.startsWith("//") ? n.href : "/dashboard"); }
  return <><button type="button" className="nav-home notification-link notification-trigger" aria-label={`Thông báo${data.unread ? `, ${data.unread} chưa đọc` : ""}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => { setOpen(true); setToast(null); }}><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM9 20h6"/></svg>{!!data.unread && <span className="notification-badge">{data.unread > 99 ? "99+" : data.unread}</span>}<span>Thông báo</span></button>
    {toast && <aside className="notification-toast" role="status"><strong>Thông báo mới</strong><p>{toast}</p><div className="actions"><button className="text-button" onClick={() => { setOpen(true); setToast(null); }}>Xem thông báo</button><button className="icon-button" aria-label="Đóng thông báo nhỏ" onClick={() => setToast(null)}>✕</button></div></aside>}
    <dialog ref={dialog} className="notification-drawer" aria-label="Thông báo nhanh" onClose={() => setOpen(false)} onClick={e => { if (e.target === dialog.current && e.clientX < dialog.current.getBoundingClientRect().left) setOpen(false); }}><header><div className="section-heading"><div><h2>Thông báo</h2><p>{data.unread} thông báo chưa đọc</p></div><button type="button" className="icon-button" aria-label="Đóng thông báo" onClick={() => setOpen(false)}>✕</button></div><div className="actions"><button className={`button ${unreadOnly ? "secondary" : ""}`} onClick={() => { setPage(1); setUnreadOnly(false); }}>Tất cả</button><button className={`button ${unreadOnly ? "" : "secondary"}`} onClick={() => { setPage(1); setUnreadOnly(true); }}>Chưa đọc ({data.unread})</button><button className="text-button" disabled={busy || !data.unread} onClick={() => { void read(); }}>Đánh dấu tất cả đã đọc</button></div></header><div className="notification-list">{error && <div role="alert"><p>{error}</p><button className="button secondary" onClick={() => { void load(); }}>Thử lại</button></div>}{!data.items.length && !error && <p>{unreadOnly ? "Bạn đã đọc hết thông báo." : "Chưa có thông báo."}</p>}{data.items.map(n => <article className={`notification-card ${n.readAt ? "" : "notification-unread"}`} key={n.id}><h3>{n.title}</h3><p>{n.body}</p><time dateTime={n.createdAt}>{new Date(n.createdAt).toLocaleString("vi-VN")}</time><div className="actions"><button className="text-button" disabled={busy} onClick={() => { void visit(n); }}>Xem chi tiết →</button>{!n.readAt && <button className="text-button" disabled={busy} onClick={() => { void read(n.id); }}>Đánh dấu đã đọc</button>}</div></article>)}<nav className="section-heading" aria-label="Phân trang thông báo">{page>1 && <button className="text-button" onClick={() => setPage(page-1)}>← Trang trước</button>}<span>Trang {page} · {data.total} thông báo</span>{page*20<data.total && <button className="text-button" onClick={() => setPage(page+1)}>Trang sau →</button>}</nav></div></dialog></>;
}
