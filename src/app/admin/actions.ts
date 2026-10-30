"use server";

import {flashActionToast} from "@/lib/action-flash";
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
import { saveCampaignDraft, cancelCampaignDraft } from "@/modules/survey-campaign/manage";
import { publishToAudience } from "@/modules/survey-campaign/audience";
import { studentSchema } from "@/modules/academic/students";
import {assignClassTeachers} from "@/modules/academic/teaching";

export async function saveClassTeachers(_:string|undefined,form:FormData){
  const user=await requireUser(Role.ADMIN);const id=String(form.get("classId")??"");
  try{await db.$transaction(tx=>assignClassTeachers(tx,user.id,id,form.getAll("lecturerIds").map(String)));}
  catch(error){return error instanceof Error&&["Chỉ chọn","Phân khoa","Một lớp"].some(p=>error.message.startsWith(p))?error.message:"Không lưu được phân công. Tải lại và thử lại.";}
  revalidatePath("/admin/classes/new");return "Đã cập nhật giảng viên thực dạy.";
}

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
  await flashActionToast("Đã tạo lớp học phần."); redirect("/admin/classes/new?saved=1");
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
  revalidatePath("/admin"); revalidatePath("/admin/students"); await flashActionToast("Đã tạo sinh viên."); redirect("/admin/users?created=1&role=STUDENT");
}

export async function createCampaign(_: string | undefined, formData: FormData) {
  const user = await requireUser(Role.ADMIN);
  const parsed = campaignSchema.safeParse({ ...Object.fromEntries(formData), courseIds: formData.getAll("courseIds") });
  if (!parsed.success) return parsed.error.issues[0].message;
  try {
    await db.$transaction(tx => saveCampaignDraft(tx,user.id,{...Object.fromEntries(formData),courseIds:formData.getAll("courseIds")}));
  } catch { return "Chưa tạo được đợt. Kiểm tra khoa, học kỳ, mẫu và môn học thuộc học kỳ đã chọn."; }
  revalidatePath("/admin"); await flashActionToast("Đã tạo đợt khảo sát nháp."); redirect("/admin?created=1");
}

export async function updateCampaign(_: string | undefined, formData: FormData) {
  const user=await requireUser(Role.ADMIN);
  const id=String(formData.get("id")??"");
  const parsed=campaignSchema.safeParse({...Object.fromEntries(formData),courseIds:formData.getAll("courseIds")});
  if(!id||!parsed.success)return "Kiểm tra lại thông tin đợt khảo sát.";
  try { await db.$transaction(tx=>saveCampaignDraft(tx,user.id,{...Object.fromEntries(formData),courseIds:formData.getAll("courseIds")},id)); }
  catch { return "Chưa lưu được. Chỉ sửa đợt nháp chưa giao phiếu; kiểm tra lại khoa, môn và học kỳ."; }
  revalidatePath("/admin");revalidatePath("/dean");await flashActionToast("Đã cập nhật đợt khảo sát nháp."); redirect(`/admin/campaigns/${id}/review?saved=1`);
}
export async function cancelCampaign(_: string | undefined, formData: FormData) {
  const user=await requireUser(Role.ADMIN);const id=String(formData.get("id")??"");
  if(formData.get("confirm")!=="yes")return "Vui lòng xác nhận hủy bản nháp.";
  try { await db.$transaction(tx=>cancelCampaignDraft(tx,user.id,id)); }
  catch { return "Chỉ hủy được đợt đang nháp. Tải lại để kiểm tra trạng thái."; }
  revalidatePath("/admin");revalidatePath("/dean");await flashActionToast("Đã hủy đợt khảo sát nháp."); redirect("/admin?status=CANCELLED");
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
  } catch (error) { return error instanceof Error && ["Chưa có sinh viên", "Môn học đã thay đổi", "Phạm vi, khoa", "Chưa phân công", "Giảng viên lớp"].some(prefix=>error.message.startsWith(prefix)) ? error.message : "Không thể công bố. Đợt có thể đã đổi trạng thái hoặc dữ liệu không còn hợp lệ."; }
  revalidatePath("/admin");
  revalidatePath("/student");
  await flashActionToast("Đã công bố đợt khảo sát."); redirect("/admin?published=1");
}
export async function closeCampaign(_: string | undefined, formData: FormData) {
  const user = await requireUser(Role.ADMIN);
  const id = z.string().min(1).parse(formData.get("id"));
  try { await db.$transaction(async tx => {
    await tx.surveyCampaign.update({ where: { id, status: "PUBLISHED" }, data: { status: "CLOSED" } });
    await tx.auditLog.create({ data: { actorId: user.id, action: "CLOSE", entity: "SurveyCampaign", entityId: id } });
    await notifyCampaign(tx, id, user.id, "CLOSED");
  }); } catch { return "Không thể đóng khảo sát. Tải lại và kiểm tra trạng thái."; }
  revalidatePath("/admin");
  return "Đã đóng khảo sát.";
}
