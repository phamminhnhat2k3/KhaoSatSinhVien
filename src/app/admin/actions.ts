"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Role } from "@prisma/client";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { hash } from "argon2";
import { normalizeAcademicCode } from "@/modules/academic/rules";

const campaignSchema = z.object({ title: z.string().trim().min(3).max(120), templateId: z.string().min(1), classIds: z.array(z.string().min(1)).min(1), startsAt: z.coerce.date(), endsAt: z.coerce.date() }).refine(v => v.endsAt > v.startsAt, "Thời gian kết thúc phải sau thời gian bắt đầu.");
const courseClassSchema = z.object({ courseCode: z.string().trim().min(2).max(20).transform(normalizeAcademicCode), courseName: z.string().trim().min(3).max(120), classCode: z.string().trim().min(2).max(30).transform(normalizeAcademicCode), semesterId: z.string().min(1), lecturerId: z.string().min(1) });
const studentSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().email(), studentCode: z.string().trim().min(3).max(30).transform(normalizeAcademicCode), password: z.string().min(8).max(100), classId: z.string().min(1) });

export async function createCourseClass(_: string | undefined, formData: FormData) {
  const user = await requireUser(Role.ADMIN);
  const parsed = courseClassSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return "Kiểm tra mã, tên học phần, lớp, học kỳ và giảng viên.";
  try {
    await db.$transaction(async tx => {
      const existing = await tx.course.findUnique({ where: { code: parsed.data.courseCode } });
      if (existing && existing.name !== parsed.data.courseName) throw new Error("Mã học phần đã có tên khác. Vui lòng sử dụng đúng tên học phần hiện có.");
      const course = existing ?? await tx.course.create({ data: { code: parsed.data.courseCode, name: parsed.data.courseName } });
      const item = await tx.courseClass.create({ data: { code: parsed.data.classCode, courseId: course.id, semesterId: parsed.data.semesterId, lecturerId: parsed.data.lecturerId } });
      await tx.auditLog.create({ data: { actorId: user.id, action: "CREATE", entity: "CourseClass", entityId: item.id } });
    });
  } catch (e) { return e instanceof Error && e.message.startsWith("Mã học phần") ? e.message : "Không thể tạo lớp. Kiểm tra mã lớp trùng hoặc học kỳ, giảng viên đã thay đổi."; }
  revalidatePath("/admin"); revalidatePath("/admin/classes/new");
  redirect("/admin/classes/new?saved=1");
}

export async function createStudent(_: string | undefined, formData: FormData) {
  const actor = await requireUser(Role.ADMIN);
  const parsed = studentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return "Kiểm tra họ tên, email, mã sinh viên, mật khẩu từ 8 ký tự và lớp ghi danh.";
  try {
    const passwordHash = await hash(parsed.data.password);
    await db.$transaction(async tx => {
      const user = await tx.user.create({ data: { email: parsed.data.email.toLowerCase(), name: parsed.data.name, passwordHash, roles: { create: { role: Role.STUDENT } }, student: { create: { studentCode: parsed.data.studentCode } } }, include: { student: true } });
      await tx.enrollment.create({ data: { classId: parsed.data.classId, studentId: user.student!.id } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "CREATE", entity: "StudentProfile", entityId: user.student!.id } });
    });
  } catch { return "Không thể ghi danh. Email hoặc mã sinh viên có thể đã tồn tại, hoặc lớp không còn khả dụng."; }
  revalidatePath("/admin"); redirect("/admin/students/new?saved=1");
}

export async function createCampaign(_: string | undefined, formData: FormData) {
  const user = await requireUser(Role.ADMIN);
  const parsed = campaignSchema.safeParse({ ...Object.fromEntries(formData), classIds: formData.getAll("classIds") });
  if (!parsed.success) return "Nhập tên đợt, chọn mẫu và ít nhất một lớp; ngày kết thúc phải sau ngày bắt đầu.";
  try {
    await db.$transaction(async tx => {
      const { classIds, ...data } = parsed.data;
      const ids = [...new Set(classIds)];
      const campaign = await tx.surveyCampaign.create({ data: { ...data, targets: { create: ids.map(classId => ({ classId })) } } });
      const enrollments = await tx.enrollment.findMany({ where: { classId: { in: ids } }, select: { studentId: true } });
      const students = [...new Set(enrollments.map(e => e.studentId))];
      if (students.length) await tx.surveyParticipation.createMany({ data: students.map(studentId => ({ campaignId: campaign.id, studentId })) });
      await tx.auditLog.create({ data: { actorId: user.id, action: "CREATE", entity: "SurveyCampaign", entityId: campaign.id } });
    });
  } catch { return "Chưa tạo được đợt. Kiểm tra mẫu và các lớp được chọn rồi thử lại."; }
  revalidatePath("/admin"); redirect("/admin?created=1");
}

export async function publishCampaign(formData: FormData) {
  const user = await requireUser(Role.ADMIN);
  const id = z.string().min(1).parse(formData.get("id"));
  await db.$transaction([
    db.surveyCampaign.update({ where: { id, status: "DRAFT" }, data: { status: "PUBLISHED", publishedAt: new Date() } }),
    db.auditLog.create({ data: { actorId: user.id, action: "PUBLISH", entity: "SurveyCampaign", entityId: id } })
  ]);
  revalidatePath("/admin");
}
export async function closeCampaign(formData: FormData) {
  const user = await requireUser(Role.ADMIN);
  const id = z.string().min(1).parse(formData.get("id"));
  await db.$transaction([
    db.surveyCampaign.update({ where: { id, status: "PUBLISHED" }, data: { status: "CLOSED" } }),
    db.auditLog.create({ data: { actorId: user.id, action: "CLOSE", entity: "SurveyCampaign", entityId: id } })
  ]);
  revalidatePath("/admin");
}
