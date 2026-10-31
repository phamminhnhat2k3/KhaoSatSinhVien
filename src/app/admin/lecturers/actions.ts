"use server";
import { hash } from "argon2";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/access";
import { canManageFaculty } from "@/modules/academic/permissions";

export async function saveLecturer(_: string | undefined, form: FormData) {
  const actor = await requireUser("ADMIN");
  const parsed = z.object({ id: z.string(), phone: z.string().trim().max(30).default(""), name: z.string().trim().min(2).max(120), email: z.email(), lecturerCode: z.string().trim().min(2).max(30), facultyId: z.string().min(1), password: z.string().max(100) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return "Kiểm tra thông tin giảng viên và khoa.";
  const { id, password, ...data } = parsed.data;
  if (!canManageFaculty(actor.roles)) return "Không có quyền quản lý khoa này.";
  if (!id && password.length < 8) return "Mật khẩu khởi tạo phải từ 8 ký tự.";
  const dean = form.get("dean") === "on";
  if (!actor.roles.includes("ADMIN") && dean) return "Chỉ quản trị viên được cấp quyền Trưởng khoa.";
  try {
    await db.$transaction(async tx => {
      const previous = id ? await tx.lecturerProfile.findUniqueOrThrow({ where: { id }, include: { user: { include: { roles: true } } } }) : null;
      if (previous && (!canManageFaculty(actor.roles) || (!actor.roles.includes("ADMIN") && previous.user.roles.some(r => r.role === "DEAN")))) throw new Error("FORBIDDEN");
      const courseIds = [...new Set(form.getAll("courseIds").map(String))];
      if (await tx.course.count({ where: { id: { in: courseIds }, facultyId: data.facultyId } }) !== courseIds.length) throw new Error("COURSE");
      const userData = { name: data.name, phone: data.phone, email: data.email.toLowerCase() };
      const lecturer = previous ? await tx.lecturerProfile.update({ where: { id }, data: { lecturerCode: data.lecturerCode, faculty: { connect: { id: data.facultyId } }, courses: { set: courseIds.map(id => ({ id })) } } }) : await tx.lecturerProfile.create({ data: { lecturerCode: data.lecturerCode, faculty: { connect: { id: data.facultyId } }, courses: { connect: courseIds.map(id => ({ id })) }, user: { create: { ...userData, passwordHash: await hash(password), roles: { create: { role: "LECTURER" as const } } } } } });
      if (actor.roles.includes("ADMIN")) {
        if (dean) await tx.userRole.upsert({ where: { userId_role: { userId: lecturer.userId, role: "DEAN" } }, create: { userId: lecturer.userId, role: "DEAN" }, update: {} });
        else await tx.userRole.deleteMany({ where: { userId: lecturer.userId, role: "DEAN" } });
      }
      await tx.auditLog.create({ data: { actorId: actor.id, action: previous ? "UPDATE" : "CREATE", entity: "LecturerProfile", entityId: lecturer.id } });
    });
  } catch { return "Không lưu được. Kiểm tra email/mã trùng, khoa, môn học hoặc quyền truy cập."; }
  revalidatePath("/admin/lecturers"); revalidatePath("/dean"); revalidatePath("/admin/users");
  return "Đã lưu giảng viên.";
}
