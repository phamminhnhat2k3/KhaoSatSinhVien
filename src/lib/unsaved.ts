"use client";
import { useEffect, useRef, type RefObject } from "react";

export type UnsavedEntry = { label: string; save?: () => Promise<boolean> | boolean; saveLabel?: string; discard?: () => void; generic?: boolean };
export const unsavedForms = new Map<HTMLFormElement, UnsavedEntry>();
export function unsavedChanged() { window.dispatchEvent(new Event("unsaved-changed")); }
export function requestUnsavedLeave(leave: () => void, scope?: HTMLElement) { window.dispatchEvent(new CustomEvent("unsaved-request", { detail: { leave, scope } })); }
export function formSnapshot(data: FormData) {
  return JSON.stringify([...data].filter(([key]) => !key.startsWith("$ACTION_")).map(([key, value]) => [key, typeof value === "string" ? value : `${value.name}:${value.size}:${value.lastModified}`]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
}
export function useUnsavedForm(ref: RefObject<HTMLFormElement | null>, dirty: boolean, options: UnsavedEntry) {
  const current = useRef(options); current.current = options;
  useEffect(() => {
    const form = ref.current;
    if (!form) return;
    if (dirty) unsavedForms.set(form, { label: current.current.label, saveLabel: current.current.saveLabel, save: current.current.save ? () => current.current.save?.() ?? false : undefined, discard: () => current.current.discard?.() });
    else unsavedForms.delete(form);
    unsavedChanged();
    return () => { unsavedForms.delete(form); unsavedChanged(); };
  }, [ref, dirty]);
}
