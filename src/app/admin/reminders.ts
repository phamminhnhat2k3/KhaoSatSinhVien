"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { remindPending } from "@/modules/notifications/reminders";

export async function sendReminder(_: string | undefined, form: FormData) {
  const actor = await requireUser("ADMIN");
  const id = String(form.get("campaignId") ?? "");
  if (!id || id.length > 150) return "Đợt khảo sát không hợp lệ.";
  try {
    const count = await db.$transaction(tx => remindPending(tx, id, actor.id), { isolationLevel: "Serializable" });
    revalidatePath(`/admin/campaigns/${id}/report`);
    return `Đã gửi lời nhắc trong web cho ${count} sinh viên chưa hoàn thành.`;
  } catch (e) { return e instanceof Error && (e.message.startsWith("Chỉ ") || e.message.startsWith("Đợt ") || e.message.startsWith("Không còn")) ? e.message : "Không gửi được lời nhắc. Vui lòng tải lại và thử lại."; }
}
