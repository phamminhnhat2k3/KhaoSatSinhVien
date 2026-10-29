"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/access";
import { userEditSchema, userRemovalIssue } from "@/modules/academic/user-management";
function refresh() { for (const p of ["/admin/users","/admin/students","/admin/lecturers","/admin/academic","/profile","/dean"]) revalidatePath(p); }
export async function updateUser(_: string | undefined, form: FormData) {
  const actor = await requireUser("ADMIN");
  const input = userEditSchema.safeParse(Object.fromEntries(form));
  if (!input.success) return "Kiểm tra họ tên, email, số điện thoại và mã nghiệp vụ.";
  try { await db.$transaction(async tx => {
    const { id, studentCode, academicClassId, ...data } = input.data;
    const user = await tx.user.findUniqueOrThrow({ where: { id }, select: { student: { select: { id: true } } } });
    if (user.student) {
      if (studentCode.length < 3 || !academicClassId) throw new Error("Chọn lớp hành chính và mã sinh viên từ 3 ký tự.");
      await tx.studentProfile.update({ where: { id: user.student.id }, data: { studentCode: studentCode.toUpperCase(), academicClassId } });
    }
    await tx.user.update({ where: { id }, data });
    await tx.auditLog.create({ data: { actorId: actor.id, action: "UPDATE", entity: "User", entityId: id } });
  }); } catch { return "Chưa lưu được. Kiểm tra email/mã trùng và lớp hành chính còn tồn tại."; }
  refresh(); return "Đã cập nhật người dùng.";
}
export async function changeUserState(_: string | undefined, form: FormData) {
  const actor = await requireUser("ADMIN");
  const id = String(form.get("id") ?? "");
  const operation = String(form.get("operation") ?? "");
  if (!["lock","unlock","delete"].includes(operation)) return "Thao tác không hợp lệ.";
  try { await db.$transaction(async tx => {
    if (id === actor.id) throw new Error("Không thể khóa hoặc xóa tài khoản đang đăng nhập.");
    const user = await tx.user.findUniqueOrThrow({ where: { id }, include: { roles: true, _count: { select: { auditLogs: true } }, student: { include: { _count: { select: { participations: true } } } }, lecturer: { include: { _count: { select: { classes: true } } } } } });
    if (operation === "delete") {
      const issue = userRemovalIssue(actor.id, { ...user, auditLogs: user._count.auditLogs, participations: user.student?._count.participations ?? 0, classes: user.lecturer?._count.classes ?? 0 });
      if (issue) throw new Error(issue);
      await tx.user.delete({ where: { id } });
    } else {
      if (operation === "lock" && user.roles.some(r => r.role === "ADMIN") && await tx.user.count({ where: { active: true, roles: { some: { role: "ADMIN" } }, id: { not: id } } }) === 0) throw new Error("Cần giữ ít nhất một quản trị viên hoạt động.");
      await tx.user.update({ where: { id }, data: { active: operation === "unlock" } });
    }
    await tx.auditLog.create({ data: { actorId: actor.id, action: operation.toUpperCase(), entity: "User", entityId: id } });
  }, { isolationLevel: "Serializable" }); } catch (e) { return e instanceof Error && /^(Không thể|Tài khoản|Cần giữ)/.test(e.message) ? e.message : "Không thể thực hiện. Dữ liệu đang được sử dụng."; }
  refresh(); return operation === "delete" ? "Đã xóa người dùng." : operation === "lock" ? "Đã khóa tài khoản." : "Đã mở khóa tài khoản.";
}
