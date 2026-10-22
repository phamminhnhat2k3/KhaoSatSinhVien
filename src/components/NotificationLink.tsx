"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function NotificationLink() {
  const [count, setCount] = useState<number | null>(null);
  const path = usePathname();
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store", signal: controller.signal });
        if (response.ok) { const data = await response.json(); setCount(data.unread); }
      } catch { /* Keep the last count when the connection is interrupted. */ }
    }
    void refresh();
    const timer = setInterval(() => { if (!document.hidden) void refresh(); }, 30000);
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [path]);
  return <Link className="nav-home notification-link" href="/notifications" aria-label={`Thông báo${count ? `, ${count} chưa đọc` : ""}`}><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM9 20h6"/></svg>{!!count && <span className="notification-badge">{count > 99 ? "99+" : count}</span>}<span>Thông báo</span></Link>;
}
