"use server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/access";
import { normalizeAcademicCode } from "@/modules/academic/rules";

const code = z.string().trim().min(2).max(30).transform(normalizeAcademicCode);
const facultySchema = z.object({ code, name: z.string().trim().min(3).max(120) });
const classSchema = facultySchema.extend({ facultyId: z.string().min(1) });
const semesterSchema = z.object({ name: z.string().trim().min(3).max(120), startsAt: z.iso.date().transform(d => new Date(`${d}T00:00:00+07:00`)), endsAt: z.iso.date().transform(d => new Date(`${d}T23:59:59.999+07:00`)) }).refine(v => v.endsAt > v.startsAt, "Ngày kết thúc không được trước ngày bắt đầu.");

export async function createFaculty(_: string | undefined, form: FormData) {
  const user = await requireUser(Role.ADMIN);
  const parsed = facultySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return "Nhập mã khoa (2–30 ký tự) và tên khoa (3–120 ký tự).";
  try { await db.$transaction(async tx => {
    const faculty = await tx.faculty.create({ data: parsed.data });
    await tx.auditLog.create({ data: { actorId: user.id, action: "CREATE", entity: "Faculty", entityId: faculty.id } });
  }); } catch { return "Chưa tạo được khoa. Kiểm tra mã khoa có bị trùng không."; }
  revalidatePath("/admin/academic"); return "Đã tạo khoa.";
}
export async function createAcademicClass(_: string | undefined, form: FormData) {
  const user = await requireUser(Role.ADMIN);
  const parsed = classSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return "Nhập mã, tên lớp hành chính và chọn khoa.";
  try { await db.$transaction(async tx => {
    const item = await tx.academicClass.create({ data: parsed.data });
    await tx.auditLog.create({ data: { actorId: user.id, action: "CREATE", entity: "AcademicClass", entityId: item.id } });
  }); } catch { return "Chưa tạo được lớp hành chính. Mã lớp có thể trùng hoặc khoa không tồn tại."; }
  revalidatePath("/admin/academic"); revalidatePath("/admin/students"); return "Đã tạo lớp hành chính.";
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
  revalidatePath("/admin/students"); revalidatePath(`/admin/students/${parsed.data.studentId}`); revalidatePath("/profile"); return "Đã cập nhật khoa/lớp hành chính. Các phiếu đã giao được giữ nguyên.";
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
  revalidatePath(`/admin/students/${parsed.data.studentId}`); return "Đã bổ sung lớp học phần. Các phiếu đã công bố không tự thay đổi.";
}
