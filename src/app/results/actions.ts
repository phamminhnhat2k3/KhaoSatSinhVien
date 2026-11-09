"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { flashActionToast } from "@/lib/action-flash";
import { db } from "@/lib/db";
import { resultActor } from "@/modules/reporting/result-actor";
import { saveResultNote } from "@/modules/reporting/notes";
export async function saveNote(_: string | undefined, form: FormData) {
  const actor = await resultActor();
  let id: string;
  try {
    const note = await saveResultNote(db, actor, { ...Object.fromEntries(form), lecturerIds: form.getAll("lecturerIds").map(String), send: form.get("intent") === "send" });
    id = note.id;
    revalidatePath("/results");
    revalidatePath(`/results/notes/${id}`);
  } catch (e) { return e instanceof Error && (e.message.startsWith("Chỉ ") || e.message.startsWith("Chưa ")) ? e.message : "Không lưu được. Kiểm tra nội dung (nhận xét và kế hoạch ít nhất 10 ký tự), phạm vi và điều kiện mở kết quả."; }
  await flashActionToast(form.get("intent") === "send" ? "Đã gửi báo cáo. Bản gửi và số liệu căn cứ được giữ nguyên." : "Đã lưu bản nháp nhận xét.");
  redirect(`/results/notes/${id}`);
}
