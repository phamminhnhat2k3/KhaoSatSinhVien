"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { formSnapshot, unsavedForms, type UnsavedEntry } from "@/lib/unsaved";

export function UnsavedChangesGuard() {
  const path = usePathname(), router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [request, setRequest] = useState<{ leave: () => void; entries: [HTMLFormElement, UnsavedEntry][] } | null>(null);
  const [error, setError] = useState(""), [busy, setBusy] = useState(false), [host, setHost] = useState<HTMLElement | null>(null);
  const release = useRef<(next: () => void) => void>(next => next());
  useEffect(() => { setHost(document.body); }, []);
  useEffect(() => { if (request && host && !dialog.current?.open) dialog.current?.showModal(); }, [request, host]);
  useEffect(() => { unsavedForms.clear(); setRequest(null); setError(""); }, [path]);
  useEffect(() => {
    const baselines = new WeakMap<HTMLFormElement, string>();
    const submissions = new Map<HTMLFormElement, string>();
    const allowed = new WeakSet<HTMLFormElement>();
    const businessForm = (form: HTMLFormElement) => form.closest(".shell main") && (form.method.toLowerCase() !== "get" || form.hasAttribute("action") && form.getAttribute("method")?.toLowerCase() !== "get");
    const rememberForms = () => {
      document.querySelectorAll<HTMLFormElement>(".shell main form").forEach(form => {
        if (businessForm(form) && !form.hasAttribute("data-leave-managed") && !baselines.has(form)) baselines.set(form, formSnapshot(new FormData(form)));
      });
    };
    rememberForms();
    const observer = new MutationObserver(rememberForms); observer.observe(document.body, { childList: true, subtree: true });
    let trapped = false, restoring = false, afterRelease: (() => void) | undefined;
    const entries = () => [...unsavedForms].filter(([form, entry]) => {
      if (!form.isConnected) return false;
      if (entry.generic && baselines.get(form) === formSnapshot(new FormData(form))) { unsavedForms.delete(form); return false; }
      return true;
    });
    const changed = () => {
      if (entries().length && !trapped) { history.pushState({ ...history.state, unsavedGuard: true }, "", location.href); trapped = true; }
    };
    release.current = next => {
      if (trapped) { afterRelease = next; trapped = false; history.back(); }
      else next();
    };
    const ask = (leave: () => void, selected = entries()) => { setError(""); setRequest({ leave, entries: selected }); };
    const beforeUnload = (event: BeforeUnloadEvent) => { if (entries().length) { event.preventDefault(); event.returnValue = ""; } };
    const pop = () => {
      if (afterRelease) { const next = afterRelease; afterRelease = undefined; next(); return; }
      if (restoring) { restoring = false; return; }
      if (trapped && entries().length) { restoring = true; history.go(1); ask(() => history.back()); }
      else if (trapped) { trapped = false; history.back(); }
      else if (history.state?.unsavedGuard && !entries().length) history.back();
    };
    const focus = (event: FocusEvent) => {
      const form = (event.target as HTMLInputElement)?.form;
      if (form && businessForm(form) && !form.hasAttribute("data-leave-managed") && !unsavedForms.has(form)) baselines.set(form, formSnapshot(new FormData(form)));
    };
    const input = (event: Event) => {
      const form = (event.target as HTMLInputElement)?.form;
      if (!form || !businessForm(form) || form.hasAttribute("data-leave-managed")) return;
      const snapshot = formSnapshot(new FormData(form));
      if (baselines.get(form) !== snapshot) unsavedForms.set(form, { label: "Biểu mẫu đang chỉnh sửa", generic: true });
      else unsavedForms.delete(form);
      changed();
    };
    const click = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.target && link.target !== "_self" || link.hasAttribute("download")) return;
      const target = new URL(link.href, location.href), current = new URL(location.href);
      const filterLink = target.origin === current.origin && target.pathname === current.pathname && target.search !== current.search && !target.hash;
      if (!filterLink && !entries().length && !trapped) return;
      if (target.protocol !== "http:" && target.protocol !== "https:" || target.pathname === current.pathname && target.search === current.search && target.origin === current.origin) return;
      event.preventDefault(); event.stopPropagation();
      const go = () => target.origin === current.origin ? router.push(target.pathname + target.search + target.hash, { scroll: !filterLink }) : location.assign(target.href);
      if (entries().length) ask(go); else release.current(go);
    };
    const submit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement;
      if (allowed.has(form)) { allowed.delete(form); submissions.set(form, formSnapshot(new FormData(form))); return; }
      if (afterRelease) { event.preventDefault(); event.stopPropagation(); return; }
      const target = new URL(form.action, location.href);
      const filter = form.method.toLowerCase() === "get" && target.origin === location.origin && target.pathname === location.pathname && (!form.target || form.target === "_self");
      const other = entries().some(([dirty]) => dirty !== form);
      const send = () => {
        if (filter) {
          const data = new FormData(form, event.submitter);
          target.search = new URLSearchParams([...data].map(([key, value]) => [key, typeof value === "string" ? value : value.name])).toString();
          router.push(target.pathname + target.search + target.hash, { scroll: false });
        } else {
          allowed.add(form);
          form.requestSubmit(event.submitter instanceof HTMLButtonElement || event.submitter instanceof HTMLInputElement ? event.submitter : undefined);
        }
      };
      if (other) { event.preventDefault(); event.stopPropagation(); ask(send); }
      else if (filter) { event.preventDefault(); event.stopPropagation(); release.current(send); }
      else submissions.set(form, formSnapshot(new FormData(form)));
    };
    const saved = (event: Event) => {
      const { data, ok } = (event as CustomEvent<{ data: FormData; ok: boolean }>).detail;
      if (!ok) { changed(); return; }
      for (const [form, snapshot] of submissions) if (snapshot === formSnapshot(data)) { unsavedForms.delete(form); baselines.set(form, formSnapshot(new FormData(form))); submissions.delete(form); }
      if (!entries().length && trapped) release.current(() => {});
    };
    const external = (event: Event) => {
      const { leave, scope } = (event as CustomEvent<{ leave: () => void; scope?: HTMLElement }>).detail;
      const selected = entries().filter(([form]) => !scope || scope.contains(form));
      if (selected.length) ask(leave, selected); else if (entries().length) leave(); else release.current(leave);
    };
    document.addEventListener("focusin", focus); document.addEventListener("input", input); document.addEventListener("change", input);
    document.addEventListener("click", click, true); document.addEventListener("submit", submit, true);
    window.addEventListener("beforeunload", beforeUnload); window.addEventListener("popstate", pop); window.addEventListener("unsaved-changed", changed); window.addEventListener("form-action-complete", saved);
    window.addEventListener("unsaved-request", external);
    return () => {
      observer.disconnect();
      document.removeEventListener("focusin", focus); document.removeEventListener("input", input); document.removeEventListener("change", input);
      document.removeEventListener("click", click, true); document.removeEventListener("submit", submit, true);
      window.removeEventListener("beforeunload", beforeUnload); window.removeEventListener("popstate", pop); window.removeEventListener("unsaved-changed", changed); window.removeEventListener("form-action-complete", saved);
      window.removeEventListener("unsaved-request", external);
      trapped = false;
    };
  }, [path, router]);
  async function leave(save: boolean) {
    if (!request) return;
    setBusy(true); setError("");
    try {
      for (const [form, entry] of request.entries) {
        if (save && (!entry.save || !await entry.save())) { setError("Chưa lưu được nội dung. Bạn vẫn ở trang này, hãy kiểm tra và thử lại."); return; }
        if (!save) entry.discard?.();
        unsavedForms.delete(form);
      }
      dialog.current?.close(); setRequest(null);
      if ([...unsavedForms.keys()].some(form => form.isConnected)) request.leave(); else release.current(request.leave);
    } catch { setError("Không lưu được nội dung. Các thay đổi vẫn được giữ trên trang."); }
    finally { setBusy(false); }
  }
  return host && createPortal(<dialog ref={dialog} className="management-dialog leave-dialog" aria-label="Thay đổi chưa lưu" onCancel={e => { if (busy) e.preventDefault(); else setRequest(null); }}>
    <h2>Bạn đang có thay đổi chưa lưu</h2><p>{request?.entries.map(([, entry]) => entry.label).join(" · ")}</p><p className="muted">{request?.entries.every(([, entry]) => entry.save) ? "Bạn muốn lưu trước khi rời trang hay bỏ các thay đổi đang nhập?" : "Rời trang sẽ bỏ các thay đổi đang nhập. Bạn có thể tiếp tục chỉnh sửa và lưu bằng nút của biểu mẫu."}</p>
    {error && <p className="error" role="alert">{error}</p>}
    <div className="actions"><button className="button secondary" disabled={busy} onClick={() => { dialog.current?.close(); setRequest(null); }}>Tiếp tục chỉnh sửa</button><button className="button danger" disabled={busy} onClick={() => void leave(false)}>Bỏ thay đổi và rời trang</button>{request?.entries.every(([, entry]) => entry.save) && <button className="button" disabled={busy} onClick={() => void leave(true)}>{busy ? "Đang lưu…" : request.entries.length === 1 ? request.entries[0][1].saveLabel ?? "Lưu nháp và rời trang" : "Lưu và rời trang"}</button>}</div>
  </dialog>, host);
}
