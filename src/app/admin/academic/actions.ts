"use server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/access";
import { normalizeAcademicCode } from "@/modules/academic/rules";
import { educationSystemSchema } from "@/modules/academic/education";

const code = z.string().trim().min(2).max(30).transform(normalizeAcademicCode);
const facultySchema = z.object({ code, name: z.string().trim().min(3).max(120) });
const classSchema = facultySchema.extend({ facultyId: z.string().min(1), educationSystem: educationSystemSchema });
const semesterSchema = z.object({ name: z.string().trim().min(3).max(120), startsAt: z.iso.date().transform(d => new Date(`${d}T00:00:00+07:00`)), endsAt: z.iso.date().transform(d => new Date(`${d}T23:59:59.999+07:00`)) }).refine(v => v.endsAt > v.startsAt, "Ngày kết thúc không được trước ngày bắt đầu.");

export async function manageFaculty(_: string | undefined, form: FormData) {
  const actor = await requireUser(Role.ADMIN);
  const id = String(form.get("id") ?? "");
  const remove = form.get("operation") === "delete";
  const parsed = facultySchema.safeParse(Object.fromEntries(form));
  if (!id || (!remove && !parsed.success)) return "Kiểm tra mã và tên khoa.";
  try { await db.$transaction(async tx => {
    if (remove) {
      const f = await tx.faculty.findUniqueOrThrow({ where: { id }, include: { _count: { select: { classes: true, lecturers: true, courses: true, campaigns: true } } } });
      if (Object.values(f._count).some(n => n > 0)) throw new Error("Khoa còn lớp, giảng viên, môn học hoặc khảo sát. Chuyển dữ liệu sang khoa phù hợp trước khi xóa.");
      await tx.faculty.delete({ where: { id } });
    } else if (parsed.success) await tx.faculty.update({ where: { id }, data: parsed.data });
    await tx.auditLog.create({ data: { actorId: actor.id, action: remove ? "DELETE" : "UPDATE", entity: "Faculty", entityId: id } });
  }, { isolationLevel: "Serializable" }); } catch (e) { return e instanceof Error && e.message.startsWith("Khoa còn") ? e.message : "Không lưu được. Mã khoa có thể trùng hoặc khoa đang được sử dụng."; }
  for (const p of ["/admin/academic","/admin/users","/admin/lecturers","/dean"]) revalidatePath(p);
  return remove ? "Đã xóa khoa." : "Đã cập nhật khoa.";
}

export async function createFaculty(_: string | undefined, form: FormData) {
  const user = await requireUser(Role.ADMIN);
  const parsed = facultySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return "Nhập mã khoa (2–30 ký tự) và tên khoa (3–120 ký tự).";
  try { await db.$transaction(async tx => {
    const faculty = await tx.faculty.create({ data: parsed.data });
    await tx.auditLog.create({ data: { actorId: user.id, action: "CREATE", entity: "Faculty", entityId: faculty.id } });
  }); } catch { return "Chưa tạo được khoa. Kiểm tra mã khoa có bị trùng không."; }
  revalidatePath("/admin/academic"); revalidatePath("/admin/users"); revalidatePath("/admin/lecturers"); return "Đã tạo khoa.";
}
export async function createAcademicClass(_: string | undefined, form: FormData) {
  const user = await requireUser(Role.ADMIN);
  const parsed = classSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return "Nhập mã, tên lớp hành chính và chọn khoa.";
  try { await db.$transaction(async tx => {
    const item = await tx.academicClass.create({ data: parsed.data });
    await tx.auditLog.create({ data: { actorId: user.id, action: "CREATE", entity: "AcademicClass", entityId: item.id } });
  }); } catch { return "Chưa tạo được lớp hành chính. Mã lớp có thể trùng hoặc khoa không tồn tại."; }
  revalidatePath("/admin/academic"); revalidatePath("/admin/students"); revalidatePath("/admin/users"); return "Đã tạo lớp hành chính.";
}
export async function updateClassEducation(_: string | undefined, form: FormData) {
  const actor = await requireUser(Role.ADMIN);
  const parsed = z.object({ id: z.string().min(1), educationSystem: educationSystemSchema }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return "Chọn hệ học hợp lệ cho lớp hành chính.";
  try {
    await db.$transaction(async tx => {
      await tx.academicClass.update({ where: { id: parsed.data.id }, data: { educationSystem: parsed.data.educationSystem } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "UPDATE_EDUCATION_SYSTEM", entity: "AcademicClass", entityId: parsed.data.id } });
    });
  } catch { return "Không cập nhật được hệ học. Kiểm tra lại lớp hành chính."; }
  revalidatePath("/admin", "layout"); revalidatePath("/profile");
  return "Đã cập nhật hệ học của lớp hành chính.";
}

export async function createSemester(_: string | undefined, form: FormData) {
  const user = await requireUser(Role.ADMIN);
  const parsed = semesterSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return "Nhập tên học kỳ và khoảng ngày hợp lệ.";
  try { await db.$transaction(async tx => {
    const item = await tx.semester.create({ data: parsed.data });
    await tx.auditLog.create({ data: { actorId: user.id, action: "CREATE", entity: "Semester", entityId: item.id } });
  }); } catch { return "Không thể tạo học kỳ. Vui lòng thử lại."; }
  revalidatePath("/admin/academic"); return "Đã tạo học kỳ.";
}
export async function updatePlacement(_: string | undefined, form: FormData) {
  const user = await requireUser(Role.ADMIN);
  const parsed = z.object({ studentId: z.string().min(1), academicClassId: z.string().min(1) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return "Chọn lớp hành chính hợp lệ.";
  try { await db.$transaction(async tx => {
    await tx.studentProfile.update({ where: { id: parsed.data.studentId }, data: { academicClassId: parsed.data.academicClassId } });
    await tx.auditLog.create({ data: { actorId: user.id, action: "UPDATE_PLACEMENT", entity: "StudentProfile", entityId: parsed.data.studentId } });
  }); } catch { return "Không thể cập nhật lớp hành chính."; }
  revalidatePath("/admin/students"); revalidatePath("/admin/users"); revalidatePath(`/admin/students/${parsed.data.studentId}`); revalidatePath("/profile"); return "Đã cập nhật khoa/lớp hành chính. Các phiếu đã giao được giữ nguyên.";
}
export async function enrollStudent(_: string | undefined, form: FormData) {
  const user = await requireUser(Role.ADMIN);
  const parsed = z.object({ studentId: z.string().min(1), semesterId: z.string().min(1), classIds: z.array(z.string().min(1)).min(1).max(200) }).safeParse({ ...Object.fromEntries(form), classIds: form.getAll("classIds") });
  if (!parsed.success) return "Chọn học kỳ và ít nhất một lớp học phần.";
  try { await db.$transaction(async tx => {
    const ids = [...new Set(parsed.data.classIds)];
    if (await tx.courseClass.count({ where: { id: { in: ids }, semesterId: parsed.data.semesterId } }) !== ids.length) throw new Error("Invalid semester");
    await tx.enrollment.createMany({ data: ids.map(classId => ({ classId, studentId: parsed.data.studentId })), skipDuplicates: true });
    await tx.auditLog.create({ data: { actorId: user.id, action: "ENROLL", entity: "StudentProfile", entityId: parsed.data.studentId } });
  }); } catch { return "Không thể ghi danh. Kiểm tra sinh viên và lớp học phần đúng học kỳ."; }
  revalidatePath(`/admin/students/${parsed.data.studentId}`); revalidatePath("/admin/users"); return "Đã bổ sung lớp học phần. Các phiếu đã công bố không tự thay đổi.";
}
