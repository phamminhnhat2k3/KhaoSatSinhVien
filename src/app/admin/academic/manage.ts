"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { educationSystemSchema } from "@/modules/academic/education";
import { normalizeAcademicCode } from "@/modules/academic/rules";

const code = z.string().trim().min(2).max(60).transform(normalizeAcademicCode);
const name = z.string().trim().min(3).max(120);
const id = z.string().min(1);
const semester = z.object({ name, startsAt: z.iso.date(), endsAt: z.iso.date() }).refine(v => v.endsAt >= v.startsAt, "Ngày kết thúc không được trước ngày bắt đầu.");
const academicClass = z.object({ code: code.pipe(z.string().max(30)), name, facultyId: id, educationSystem: educationSystemSchema });
const course = z.object({ code, name, facultyId: id });
const courseClass = z.object({ code: code.pipe(z.string().max(30)), courseId: id, semesterId: id, educationSystem: educationSystemSchema, capacity: z.coerce.number().int().min(1).max(10000) });
const request = z.object({ id, kind: z.enum(["Semester", "AcademicClass", "Course", "CourseClass"]), operation: z.enum(["update", "delete"]) });
const inUse = (counts: Record<string, number>) => Object.values(counts).some(n => n > 0);

export async function manageAcademic(_: string | undefined, form: FormData) {
  const actor = await requireUser("ADMIN");
  const raw = Object.fromEntries(form);
  const parsed = request.safeParse(raw);
  if (!parsed.success) return "Thao tác không hợp lệ. Vui lòng mở lại cửa sổ chỉnh sửa.";
  const { id, kind, operation } = parsed.data;
  const remove = operation === "delete";
  try {
    await db.$transaction(async tx => {
      if (kind === "Semester") {
        const old = await tx.semester.findUniqueOrThrow({ where: { id }, include: { _count: { select: { classes: true, campaigns: true, studentStudyPlans: true } } } });
        if (remove) {
          if (inUse(old._count)) throw new Error("Không thể xóa học kỳ còn lớp học phần, khảo sát hoặc kế hoạch học riêng.");
          await tx.semester.delete({ where: { id } });
        } else {
          const data = semester.parse(raw);
          const startsAt = new Date(`${data.startsAt}T00:00:00+07:00`), endsAt = new Date(`${data.endsAt}T23:59:59.999+07:00`);
          const date = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
          if (inUse(old._count) && (date(startsAt) !== date(old.startsAt) || date(endsAt) !== date(old.endsAt))) throw new Error("Không thể đổi thời gian học kỳ đã có lớp, khảo sát hoặc kế hoạch học. Bạn vẫn có thể sửa tên.");
          await tx.semester.update({ where: { id }, data: { name: data.name, startsAt: inUse(old._count) ? old.startsAt : startsAt, endsAt: inUse(old._count) ? old.endsAt : endsAt } });
        }
      } else if (kind === "AcademicClass") {
        const old = await tx.academicClass.findUniqueOrThrow({ where: { id }, include: { _count: { select: { students: true, studyAssignments: true, campaignTargets: true } } } });
        if (remove) {
          if (inUse(old._count)) throw new Error("Không thể xóa lớp hành chính còn sinh viên, phân công hoặc đích khảo sát.");
          await tx.academicClass.delete({ where: { id } });
        } else {
          const data = academicClass.parse(raw);
          if (data.facultyId !== old.facultyId && inUse(old._count)) throw new Error("Không thể đổi khoa của lớp đang có sinh viên, phân công hoặc khảo sát. Hãy điều chỉnh dữ liệu liên quan trước.");
          if (data.educationSystem !== old.educationSystem) {
            const incompatible = { educationSystem: { not: data.educationSystem }, semester: { endsAt: { gte: new Date() } } };
            const [shared, personal] = await Promise.all([
              tx.classStudyAssignment.count({ where: { academicClassId: id, class: incompatible } }),
              tx.enrollment.count({ where: { student: { academicClassId: id }, class: incompatible } }),
            ]);
            if (shared || personal) throw new Error("Không thể đổi hệ học vì phân công hoặc ghi danh ở học kỳ chưa kết thúc không khớp hệ mới.");
          }
          await tx.academicClass.update({ where: { id }, data });
        }
      } else if (kind === "Course") {
        const old = await tx.course.findUniqueOrThrow({ where: { id }, include: { _count: { select: { classes: true, lecturers: true, campaignTargets: true, assignments: true, teachingEvaluations: true, answers: true } } } });
        if (remove) {
          if (inUse(old._count)) throw new Error("Không thể xóa môn còn lớp học phần, giảng viên, khảo sát hoặc phản hồi.");
          await tx.course.delete({ where: { id } });
        } else {
          const data = course.parse(raw);
          if (data.facultyId !== old.facultyId && inUse(old._count)) throw new Error("Không thể đổi khoa của môn đã được phân công hoặc sử dụng trong khảo sát.");
          await tx.course.update({ where: { id }, data });
        }
      } else {
        const old = await tx.courseClass.findUniqueOrThrow({ where: { id }, include: { _count: { select: { enrollments: true, academicAssignments: true, targets: true, teachings: true } } } });
        if (remove) {
          if (old._count.enrollments || old._count.academicAssignments || old._count.targets || old._count.teachings || old.lecturerId) throw new Error("Không thể xóa lớp học phần còn ghi danh, phân công giảng viên, phân công lớp hành chính hoặc đích khảo sát.");
          await tx.courseClass.delete({ where: { id } });
        } else {
          const data = courseClass.parse(raw);
          const changed = data.courseId !== old.courseId || data.semesterId !== old.semesterId || data.educationSystem !== old.educationSystem;
          if (changed && (inUse(old._count) || old.lecturerId)) throw new Error("Không thể đổi môn, học kỳ hoặc hệ của lớp đã ghi danh, phân công giảng viên hoặc dùng trong khảo sát.");
          if (data.capacity < old._count.enrollments) throw new Error("Không thể giảm sĩ số xuống dưới số sinh viên đã ghi danh trực tiếp.");
          await tx.courseClass.update({ where: { id }, data });
        }
      }
      await tx.auditLog.create({ data: { actorId: actor.id, action: remove ? "DELETE" : "UPDATE", entity: kind, entityId: id } });
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (error instanceof z.ZodError) return "Kiểm tra mã, tên, ngày tháng và các lựa chọn. Sĩ số phải từ 1 đến 10.000.";
    return error instanceof Error && error.message.startsWith("Không thể") ? error.message : "Không lưu được. Mã có thể trùng, dữ liệu đã thay đổi hoặc danh mục đang được sử dụng. Hãy tải lại và thử lại.";
  }
  for (const path of ["/admin", "/student", "/lecturer", "/dean"]) revalidatePath(path, "layout");
  revalidatePath("/profile");
  return remove ? "Đã xóa danh mục." : "Đã cập nhật danh mục.";
}
