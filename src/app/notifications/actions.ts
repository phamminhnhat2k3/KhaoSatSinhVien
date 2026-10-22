"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { markRead } from "@/modules/notifications/service";

export async function readNotification(form: FormData) {
  const user = await requireUser();
  const id = form.get("id");
  if (typeof id !== "string" || !id) return;
  await markRead(db, user.id, id);
  revalidatePath("/notifications");
}
export async function readAllNotifications() {
  const user = await requireUser();
  await markRead(db, user.id);
  revalidatePath("/notifications");
}
