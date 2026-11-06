import type { Prisma } from "@prisma/client";
import { z } from "zod";

const selection = z.object({ semesterId: z.string().min(1), classIds: z.array(z.string().min(1)).max(200) });

export function effectiveEnrollments<T extends { class: { id: string } }>(shared: T[], personal: T[], overridden: boolean): T[] {
  return [...new Map((overridden ? personal : [...shared, ...personal]).map(e => [e.class.id, e])).values()];
}

async function validateGroups(tx: Prisma.TransactionClient, semesterId: string, ids: string[], facultyId: string, educationSystem: string) {
  const teacher = { facultyId: true, user: { select: { active: true, roles: { select: { role: true } } } } } as const;
  const groups = await tx.courseClass.findMany({ where: { id: { in: ids }, semesterId, educationSystem, course: { facultyId } }, select: { id: true, courseId: true, teachingConfigured: true, lecturer: { select: teacher }, teachings: { select: { lecturer: { select: teacher } } } } });
  if (groups.length !== ids.length) throw new Error("Chỉ chọn lớp học phần thuộc khoa, học kỳ và hệ học của lớp hành chính.");
  if (new Set(groups.map(g => g.courseId)).size !== groups.length) throw new Error("Mỗi môn chỉ chọn một lớp học phần và một giảng viên.");
  for (const group of groups) {
    const teachers = group.teachings.length ? group.teachings.map(t => t.lecturer) : !group.teachingConfigured && group.lecturer ? [group.lecturer] : [];
    if (teachers.length !== 1 || teachers[0].facultyId !== facultyId || !teachers[0].user.active || !teachers[0].user.roles.some(r => r.role === "LECTURER")) throw new Error("Mỗi lớp học phần phải có đúng một giảng viên đang hoạt động trong khoa. Kiểm tra lại phân công giảng viên.");
  }
}

export async function saveClassStudyPlan(tx: Prisma.TransactionClient, actorId: string, input: unknown) {
  const data = selection.extend({ academicClassId: z.string().min(1) }).parse(input);
  const group = await tx.academicClass.findUniqueOrThrow({ where: { id: data.academicClassId } });
  const ids = [...new Set(data.classIds)];
  await tx.semester.findUniqueOrThrow({ where: { id: data.semesterId } });
  await validateGroups(tx, data.semesterId, ids, group.facultyId, group.educationSystem);
  await tx.classStudyAssignment.deleteMany({ where: { academicClassId: group.id, class: { semesterId: data.semesterId } } });
  if (ids.length) await tx.classStudyAssignment.createMany({ data: ids.map(classId => ({ academicClassId: group.id, classId })) });
  await tx.auditLog.create({ data: { actorId, action: "ASSIGN_CLASS_STUDY", entity: "AcademicClass", entityId: group.id } });
}

export async function saveStudentStudyPlan(tx: Prisma.TransactionClient, actorId: string, input: unknown) {
  const data = selection.extend({ studentId: z.string().min(1), reset: z.boolean().default(false) }).parse(input);
  const student = await tx.studentProfile.findUniqueOrThrow({ where: { id: data.studentId }, include: { academicClass: true } });
  if (!student.academicClass) throw new Error("Phân lớp hành chính cho sinh viên trước khi điều chỉnh môn học.");
  await tx.semester.findUniqueOrThrow({ where: { id: data.semesterId } });
  const ids = [...new Set(data.classIds)];
  if (!data.reset) await validateGroups(tx, data.semesterId, ids, student.academicClass.facultyId, student.academicClass.educationSystem);
  await tx.enrollment.deleteMany({ where: { studentId: data.studentId, class: { semesterId: data.semesterId } } });
  await tx.studentStudyPlan.deleteMany({ where: { studentId: data.studentId, semesterId: data.semesterId } });
  if (!data.reset) {
    await tx.studentStudyPlan.create({ data: { studentId: data.studentId, semesterId: data.semesterId } });
    if (ids.length) await tx.enrollment.createMany({ data: ids.map(classId => ({ classId, studentId: data.studentId })) });
  }
  await tx.auditLog.create({ data: { actorId, action: data.reset ? "RESET_STUDENT_STUDY" : "OVERRIDE_STUDENT_STUDY", entity: "StudentProfile", entityId: data.studentId } });
}
