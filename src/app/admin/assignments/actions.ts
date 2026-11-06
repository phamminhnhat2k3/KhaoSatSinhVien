"use server";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { saveClassStudyPlan, saveStudentStudyPlan } from "@/modules/academic/study-plan";

export async function assignClassStudy(_: string | undefined, form: FormData) {
  const actor = await requireUser(Role.ADMIN);
  try {
    await db.$transaction(tx => saveClassStudyPlan(tx, actor.id, { ...Object.fromEntries(form), classIds: form.getAll("classIds").map(String).filter(Boolean) }), { isolationLevel: "Serializable" });
  } catch (error) {
    return error instanceof Error && ["Chỉ chọn", "Mỗi môn"].some(p => error.message.startsWith(p)) ? error.message : "Không lưu được phân công. Kiểm tra lớp, khoa và học kỳ.";
  }
  revalidatePath("/admin", "layout");
  return "Đã lưu phân công chung cho lớp. Phiếu đã công bố được giữ nguyên.";
}

export async function adjustStudentStudy(_: string | undefined, form: FormData) {
  const actor = await requireUser(Role.ADMIN);
  try {
    await db.$transaction(tx => saveStudentStudyPlan(tx, actor.id, { ...Object.fromEntries(form), classIds: form.getAll("classIds").map(String).filter(Boolean), reset: form.get("operation") === "reset" }), { isolationLevel: "Serializable" });
  } catch (error) {
    return error instanceof Error && ["Chỉ chọn", "Mỗi môn", "Phân lớp"].some(p => error.message.startsWith(p)) ? error.message : "Không lưu được môn học riêng. Kiểm tra sinh viên, khoa và học kỳ.";
  }
  revalidatePath("/admin", "layout");
  return form.get("operation") === "reset" ? "Đã đưa sinh viên về phân công chung của lớp trong học kỳ." : "Đã lưu môn học riêng trong học kỳ. Phiếu đã công bố được giữ nguyên.";
}
