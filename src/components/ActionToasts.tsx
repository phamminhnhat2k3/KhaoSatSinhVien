"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useSearchParams } from "next/navigation";
import { ACTION_FLASH, readActionFlash, type ActionFeedback } from "@/lib/action-feedback";
type Toast = ActionFeedback & { id: string; expires: number };
function ToastItem({ toast, close }: { toast: Toast; close: () => void }) {
  useEffect(() => { const timer = setTimeout(close, Math.max(0, toast.expires - Date.now())); return () => clearTimeout(timer); }, [toast.expires, close]);
  return <div className={`action-toast action-toast-${toast.kind}`} data-testid="action-toast"><span aria-hidden="true">{toast.kind === "success" ? "✓" : "!"}</span><p><strong>{toast.kind === "success" ? "Thành công" : "Chưa thực hiện được"}</strong>{toast.message}</p><button type="button" onClick={close} aria-label="Đóng thông báo thao tác">×</button></div>;
}
export function ActionToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]), [announcement, setAnnouncement] = useState("");
  const [host, setHost] = useState<Element | null>(null);
  const ref = useRef<HTMLDivElement>(null), seen = useRef(new Set<string>());
  const pathname = usePathname(), search = useSearchParams();
  useEffect(() => {
    // A modal makes everything outside it inert, including top-layer popovers.
    const locate = () => setHost([...document.querySelectorAll("dialog[open]")].at(-1) ?? document.body);
    locate();
    const observer = new MutationObserver(locate);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["open"] });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const add = (feedback: ActionFeedback & { id: string }) => {
      if (seen.current.has(feedback.id)) return;
      seen.current.add(feedback.id);
      setToasts(items => [...items, { ...feedback, expires: Date.now() + 5000 }]);
      setAnnouncement(feedback.message);
    };
    const consume = () => {
      const feedback = readActionFlash(document.cookie);
      if (feedback) { document.cookie = `${ACTION_FLASH}=; Path=/; Max-Age=0; SameSite=Lax`; add(feedback); }
    };
    const receive = (event: Event) => add((event as CustomEvent<ActionFeedback & { id: string }>).detail);
    window.addEventListener("action-feedback", receive); window.addEventListener("consume-action-feedback", consume); consume();
    return () => { window.removeEventListener("action-feedback", receive); window.removeEventListener("consume-action-feedback", consume); };
  }, [pathname, search]);
  useEffect(() => {
    const panel = ref.current;
    // Popovers remain above quick-edit dialogs without stealing focus.
    if (panel?.showPopover) { panel.hidePopover(); if (toasts.length) panel.showPopover(); }
  }, [toasts, host]);
  return host && createPortal(<><div ref={ref} popover="manual" className="action-toasts" role="region" aria-label="Thông báo thao tác">{toasts.map(toast => <ToastItem key={toast.id} toast={toast} close={() => setToasts(items => items.filter(item => item.id !== toast.id))}/>)}</div><div className="action-toast-announcement" aria-live="polite" aria-atomic="true">{announcement}</div></>, host);
}
