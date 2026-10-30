export const ACTION_FLASH = "action-feedback";
export type ActionFeedback = { message: string; kind: "success" | "error" };
export function actionFeedback(result: unknown): ActionFeedback | undefined {
  if (typeof result === "string" && result) return { message: result, kind: result.startsWith("Đã ") ? "success" : "error" };
  if (result && typeof result === "object" && "ok" in result && "message" in result && typeof result.message === "string") return { message: result.message, kind: result.ok ? "success" : "error" };
}
export function readActionFlash(cookie: string): (ActionFeedback & { id: string }) | undefined {
  try {
    const raw = cookie.split("; ").find(part => part.startsWith(`${ACTION_FLASH}=`));
    if (!raw) return;
    const value = JSON.parse(decodeURIComponent(raw.slice(ACTION_FLASH.length + 1)));
    if (typeof value.id === "string" && typeof value.message === "string" && value.message.length <= 1000 && ["success", "error"].includes(value.kind)) return value;
  } catch { /* Ignore expired or malformed feedback. */ }
}
export function showActionToast(message: string, kind: ActionFeedback["kind"] = "success") {
  window.dispatchEvent(new CustomEvent("action-feedback", { detail: { message, kind, id: crypto.randomUUID() } }));
}
