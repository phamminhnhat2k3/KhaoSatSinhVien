"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Role } from "@prisma/client";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { hash } from "argon2";
import { normalizeAcademicCode } from "@/modules/academic/rules";
import { notifyCampaign } from "@/modules/notifications/service";
import { campaignSchema } from "@/modules/survey-campaign/input";
import { publishToAudience } from "@/modules/survey-campaign/audience";
import { studentSchema } from "@/modules/academic/students";

const courseClassSchema = z.object({ courseCode: z.string().trim().min(2).max(20).transform(normalizeAcademicCode), courseName: z.string().trim().min(3).max(120), classCode: z.string().trim().min(2).max(30).transform(normalizeAcademicCode), semesterId: z.string().min(1), facultyId: z.string().min(1), educationSystem: z.enum(["REGULAR", "PART_TIME", "DISTANCE"]), capacity: z.coerce.number().int().min(1).max(10000) });

export async function createCourseClass(_: string | undefined, formData: FormData) {
  const user = await requireUser(Role.ADMIN);
  const parsed = courseClassSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return "Kiểm tra mã, tên môn, lớp, học kỳ, khoa, hệ đào tạo và sĩ số.";
  try {
    await db.$transaction(async tx => {
      const existing = await tx.course.findUnique({ where: { code: parsed.data.courseCode } });
      if (existing && existing.name !== parsed.data.courseName) throw new Error("Mã học phần đã có tên khác. Vui lòng sử dụng đúng tên học phần hiện có.");
      if (existing?.facultyId && existing.facultyId !== parsed.data.facultyId) throw new Error("Mã học phần thuộc khoa khác.");
      const course = existing ? await tx.course.update({ where: { id: existing.id }, data: { facultyId: parsed.data.facultyId } }) : await tx.course.create({ data: { code: parsed.data.courseCode, name: parsed.data.courseName, facultyId: parsed.data.facultyId } });
      const item = await tx.courseClass.create({ data: { code: parsed.data.classCode, courseId: course.id, semesterId: parsed.data.semesterId, educationSystem: parsed.data.educationSystem, capacity: parsed.data.capacity } });
      await tx.auditLog.create({ data: { actorId: user.id, action: "CREATE", entity: "CourseClass", entityId: item.id } });
    });
  } catch (e) { return e instanceof Error && e.message.startsWith("Mã học phần") ? e.message : "Không thể tạo lớp. Kiểm tra mã lớp trùng hoặc học kỳ, giảng viên đã thay đổi."; }
  revalidatePath("/admin"); revalidatePath("/admin/classes/new");
  redirect("/admin/classes/new?saved=1");
}

export async function createStudent(_: string | undefined, formData: FormData) {
  const actor = await requireUser(Role.ADMIN);
  const parsed = studentSchema.safeParse({ ...Object.fromEntries(formData), courseClassIds: formData.getAll("courseClassIds") });
  if (!parsed.success) return "Kiểm tra họ tên, email, mã sinh viên, mật khẩu từ 8 ký tự và lớp hành chính.";
  try {
    const passwordHash = await hash(parsed.data.password);
    await db.$transaction(async tx => {
      const user = await tx.user.create({ data: { email: parsed.data.email.toLowerCase(), name: parsed.data.name, passwordHash, roles: { create: { role: Role.STUDENT } }, student: { create: { studentCode: parsed.data.studentCode, academicClassId: parsed.data.academicClassId } } }, include: { student: true } });
      const classIds = [...new Set(parsed.data.courseClassIds)];
      if (classIds.length) await tx.enrollment.createMany({ data: classIds.map(classId => ({ classId, studentId: user.student!.id })) });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "CREATE", entity: "StudentProfile", entityId: user.student!.id } });
    });
  } catch { return "Không thể tạo sinh viên. Email/mã sinh viên có thể trùng, hoặc lớp không còn khả dụng."; }
  revalidatePath("/admin"); revalidatePath("/admin/students"); redirect("/admin/users?created=1&role=STUDENT");
}

export async function createCampaign(_: string | undefined, formData: FormData) {
  const user = await requireUser(Role.ADMIN);
  const parsed = campaignSchema.safeParse({ ...Object.fromEntries(formData), courseIds: formData.getAll("courseIds") });
  if (!parsed.success) return parsed.error.issues[0].message;
  try {
    await db.$transaction(async tx => {
      const { courseIds, facultyId, courseTemplateId, ...data } = parsed.data;
      const ids = [...new Set(courseIds)];
      const matching = await tx.course.count({ where: { id: { in: ids }, ...(data.scope === "FACULTY" ? { facultyId } : {}), classes: { some: { semesterId: data.semesterId } } } });
      if (matching !== ids.length) throw new Error("Môn học phải có lớp học phần trong học kỳ đã chọn.");
      const campaign = await tx.surveyCampaign.create({ data: { ...data, facultyId: facultyId || null, courseTemplateId: courseTemplateId || null, courseTargets: { create: ids.map(courseId => ({ courseId })) } } });
      await tx.auditLog.create({ data: { actorId: user.id, action: "CREATE", entity: "SurveyCampaign", entityId: campaign.id } });
      if (facultyId) {
        const deans = await tx.lecturerProfile.findMany({ where: { facultyId, user: { active: true, roles: { some: { role: "DEAN" } } } }, select: { userId: true } });
        await tx.notification.createMany({ data: deans.map(d => ({ userId: d.userId, title: "Đợt khảo sát chờ xét duyệt", body: campaign.title, href: "/dean" })) });
      }
    });
  } catch { return "Chưa tạo được đợt. Kiểm tra khoa, học kỳ, mẫu và môn học thuộc học kỳ đã chọn."; }
  revalidatePath("/admin"); redirect("/admin?created=1");
}

export async function publishCampaign(_: string | undefined, formData: FormData) {
  const user = await requireUser(Role.ADMIN);
  const id = z.string().min(1).parse(formData.get("id"));
  try {
    await db.$transaction(async tx => {
      await publishToAudience(tx, id);
      await tx.auditLog.create({ data: { actorId: user.id, action: "PUBLISH", entity: "SurveyCampaign", entityId: id } });
      await notifyCampaign(tx, id, user.id, "PUBLISHED");
    }, { timeout: 30000 });
  } catch (error) { return error instanceof Error && ["Chưa có sinh viên", "Môn học đã thay đổi", "Phạm vi, khoa"].some(prefix=>error.message.startsWith(prefix)) ? error.message : "Không thể công bố. Đợt có thể đã đổi trạng thái hoặc dữ liệu không còn hợp lệ."; }
  revalidatePath("/admin");
  revalidatePath("/student");
  redirect("/admin?published=1");
}
export async function closeCampaign(formData: FormData) {
  const user = await requireUser(Role.ADMIN);
  const id = z.string().min(1).parse(formData.get("id"));
  await db.$transaction(async tx => {
    await tx.surveyCampaign.update({ where: { id, status: "PUBLISHED" }, data: { status: "CLOSED" } });
    await tx.auditLog.create({ data: { actorId: user.id, action: "CLOSE", entity: "SurveyCampaign", entityId: id } });
    await notifyCampaign(tx, id, user.id, "CLOSED");
  });
  revalidatePath("/admin");
}
