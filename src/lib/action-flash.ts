import { cookies } from "next/headers";
import { ACTION_FLASH } from "./action-feedback";
export async function flashActionToast(message: string) {
  (await cookies()).set(ACTION_FLASH, JSON.stringify({ id: crypto.randomUUID(), message, kind: "success" }), { path: "/", sameSite: "lax", maxAge: 60 });
}
