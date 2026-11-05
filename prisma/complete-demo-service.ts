import assert from "node:assert/strict";
import { Prisma, type PrismaClient } from "@prisma/client";
import { templateSchema } from "../src/modules/templates/rules";
import { assignedQuestions } from "../src/modules/response/questions";
import { validateAnswers } from "../src/modules/response/rules";
import { saveCampaignDraft } from "../src/modules/survey-campaign/manage";
import { publishToAudience } from "../src/modules/survey-campaign/audience";
import { notifyCampaign } from "../src/modules/notifications/service";
import { completeClasses, completeCourses, completeExceptions, completeFaculties, completeGroups, completeSemesters, completeStudents, completeTeachers, completeTemplates, demoAnswerValues } from "./complete-demo-data";

export async function fillDemoResponse(tx: Prisma.TransactionClient, campaignId: string, studentId: string, index: number, when: Date, draft = false) {
  const participation = await tx.surveyParticipation.findUniqueOrThrow({ where: { campaignId_studentId: { campaignId, studentId } }, include: {
    courses: { include: { course: true } }, teachings: { include: { course: true, lecturer: { include: { user: { select: { name: true } } } } } },
    campaign: { include: { template: { include: { questions: { include: { options: true }, orderBy: { position: "asc" } } } }, courseTemplate: { include: { questions: { include: { options: true }, orderBy: { position: "asc" } } } } } }
  } });
  const questions = assignedQuestions(participation.campaign, participation.courses, participation.teachings);
  const answers = demoAnswerValues(questions, index);
  assert.deepEqual(validateAnswers(questions.map(q => ({ ...q, optionValues: q.options.map(o => o.value) })), answers), {});
  if (draft) {
    await tx.surveyParticipation.update({ where: { id: participation.id }, data: { status: "DRAFT", draft: Object.fromEntries(Object.entries(answers).slice(0, 3)) } });
  } else {
    await tx.submission.create({ data: { campaignId, submittedAt: when, answers: { createMany: { data: questions.map(q => ({ questionId: q.questionId, courseId: q.courseId, lecturerId: q.lecturerId, value: answers[q.id] })) } } } });
    await tx.surveyParticipation.update({ where: { id: participation.id }, data: { status: "COMPLETED", completedAt: when, draft: Prisma.DbNull } });
  }
}

const day = (date: Date, offset: number) => new Date(date.getTime() + offset * 86400000);
const dateOnly = (date: Date) => date.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });

export async function resetCompleteDemo(db: PrismaClient, hashes: Map<string, string>, now = new Date()) {
  for (const template of completeTemplates) templateSchema.parse(template);
  assert(Number(process.env.MIN_REPORT_RESPONSES ?? 5) <= 5, "Cần ngưỡng báo cáo không quá 5 để xem đủ nhóm giảng viên trong lớp mẫu 5 sinh viên.");
  const admins = await db.user.findMany({ where: { roles: { some: { role: "ADMIN" } } }, select: { id: true, email: true, name: true, active: true } });
  const actor = admins.find(a => a.active);
  assert(actor, "Phải có Admin đang hoạt động để giữ lại.");
  const actorId = actor.id;
  assert([...completeStudents, ...completeTeachers].every(a => hashes.has(a.id)) && admins.every(a => hashes.has(a.id)), "Thiếu mật khẩu băm cho bộ demo.");
  assert(admins.every(a => ![...completeStudents, ...completeTeachers].some(b => b.email === a.email || b.id === a.id)), "Tài khoản demo trùng tài khoản Admin cần giữ.");
  const campaigns: { id: string; title: string; kind: string; facultyId: string | null }[] = [];
  await db.$transaction(async tx => {
    await tx.answer.deleteMany(); await tx.submission.deleteMany();
    await tx.participationTeaching.deleteMany(); await tx.participationCourse.deleteMany(); await tx.surveyParticipation.deleteMany();
    await tx.surveyTarget.deleteMany(); await tx.campaignCourse.deleteMany(); await tx.campaignAcademicClass.deleteMany(); await tx.surveyCampaign.deleteMany();
    await tx.questionOption.deleteMany(); await tx.question.deleteMany(); await tx.surveyTemplate.deleteMany();
    await tx.enrollment.deleteMany(); await tx.studentStudyPlan.deleteMany(); await tx.classStudyAssignment.deleteMany();
    await tx.courseTeaching.deleteMany(); await tx.courseClass.deleteMany(); await tx.course.deleteMany(); await tx.semester.deleteMany();
    await tx.studentProfile.deleteMany(); await tx.lecturerProfile.deleteMany(); await tx.academicClass.deleteMany(); await tx.faculty.deleteMany();
    await tx.notification.deleteMany(); await tx.auditLog.deleteMany();
    await tx.userRole.deleteMany({ where: { OR: [{ userId: { notIn: admins.map(a => a.id) } }, { role: { not: "ADMIN" } }] } });
    await tx.user.deleteMany({ where: { id: { notIn: admins.map(a => a.id) } } });
    for (const admin of admins) await tx.user.update({ where: { id: admin.id }, data: { passwordHash: hashes.get(admin.id)! } });
    await tx.semester.createMany({ data: completeSemesters });
    await tx.faculty.createMany({ data: completeFaculties });
    await tx.academicClass.createMany({ data: completeClasses.map(({ index, facultyCode, ...c }) => { void index; void facultyCode; return c; }) });
    for (const teacher of completeTeachers) await tx.user.create({ data: {
      id: teacher.id, name: teacher.name, email: teacher.email, passwordHash: hashes.get(teacher.id)!, department: completeFaculties.find(f => f.id === teacher.facultyId)!.name,
      roles: { create: teacher.dean ? [{ role: "LECTURER" }, { role: "DEAN" }] : [{ role: "LECTURER" }] },
      lecturer: { create: { id: teacher.profileId, lecturerCode: teacher.code, facultyId: teacher.facultyId } }
    } });
    for (const course of completeCourses) {
      const teacherIds = [...new Set([...completeGroups, ...completeExceptions.map(e => e.alternate)].filter(g => g.courseId === course.id).map(g => g.lecturerId))];
      await tx.course.create({ data: { id: course.id, code: course.code, name: course.name, facultyId: course.facultyId, lecturers: { connect: teacherIds.map(id => ({ id })) } } });
    }
    for (const group of [...completeGroups, ...completeExceptions.map(e => e.alternate)]) {
      const { academicClassId, ...data } = group; void academicClassId;
      await tx.courseClass.create({ data: { ...data, teachingConfigured: true, teachings: { create: { lecturerId: group.lecturerId } } } });
    }
    await tx.classStudyAssignment.createMany({ data: completeGroups.map(g => ({ academicClassId: g.academicClassId, classId: g.id })) });
    for (const student of completeStudents) await tx.user.create({ data: {
      id: student.id, email: student.email, name: student.name, passwordHash: hashes.get(student.id)!, department: completeFaculties.find(f => f.id === student.facultyId)!.name,
      roles: { create: { role: "STUDENT" } }, student: { create: { id: student.profileId, studentCode: student.code, academicClassId: student.academicClassId } }
    } });
    for (const exception of completeExceptions) {
      await tx.studentStudyPlan.create({ data: { studentId: exception.studentId, semesterId: exception.semesterId } });
      await tx.enrollment.createMany({ data: exception.classIds.map(classId => ({ classId, studentId: exception.studentId })) });
    }
    for (const template of completeTemplates) await tx.surveyTemplate.create({ data: { id: template.id, title: template.title, questions: { create: template.questions.map((q, position) => ({ ...q, position: position + 1, options: { create: q.options.map((o, i) => ({ ...o, position: i + 1 })) } })) } } });

    async function makeCampaign(kind: string, facultyId: string | null, homeIds: string[], semesterIndex: number) {
      const faculty = completeFaculties.find(f => f.id === facultyId);
      const closed = kind === "closed", scheduled = kind === "scheduled", university = !faculty;
      const prefix = university ? "Toàn trường" : faculty.name;
      const title = `${prefix} · ${closed ? "Kết quả HK2 2025–2026" : kind === "draft" ? "Bản nháp khảo sát HK1" : scheduled ? "Đợt sắp mở HK1" : kind === "cancelled" ? "Đợt đã hủy để thử bộ lọc" : "Khảo sát giữa HK1 2026–2027"}${university ? " · Cơ sở vật chất" : ""}`;
      const start = closed ? new Date("2026-06-01T00:00:00+07:00") : day(now, scheduled ? 7 : -7);
      const end = closed ? new Date("2026-06-20T23:59:59+07:00") : day(now, scheduled ? 37 : 60);
      const campaign = await saveCampaignDraft(tx, actorId, {
        title, scope: university ? "UNIVERSITY" : "FACULTY", semesterId: completeSemesters[semesterIndex].id, facultyId: facultyId ?? "", academicClassIds: homeIds,
        templateId: university ? "demo-mau-toan-truong" : "demo-mau-chung", courseTemplateId: university ? "" : "demo-mau-giang-day", evaluationMode: university ? "COURSE" : "LECTURER",
        courseIds: university ? [] : completeCourses.filter(c => c.facultyId === facultyId && c.semesterId === completeSemesters[semesterIndex].id).map(c => c.id),
        startsAt: dateOnly(start), endsAt: dateOnly(end)
      });
      campaigns.push({ id: campaign.id, title, kind, facultyId });
      if (kind === "cancelled") { await tx.surveyCampaign.update({ where: { id: campaign.id }, data: { status: "CANCELLED" } }); return; }
      if (kind === "draft") return;
      await publishToAudience(tx, campaign.id);
      await tx.auditLog.create({ data: { actorId: actorId, action: "PUBLISH_DEMO", entity: "SurveyCampaign", entityId: campaign.id } });
      await notifyCampaign(tx, campaign.id, actorId, "PUBLISHED");
      const students = completeStudents.filter(s => university || homeIds.includes(s.academicClassId));
      for (const [i, student] of students.entries()) {
        if (closed || !scheduled && (university ? student.index === 14 : student.index % 5 === 2)) await fillDemoResponse(tx, campaign.id, student.profileId, i, closed ? new Date("2026-06-15T10:00:00+07:00") : day(now, -1));
        else if (!scheduled && !university && student.index % 5 === 1) await fillDemoResponse(tx, campaign.id, student.profileId, i, now, true);
      }
      if (closed) {
        await tx.surveyCampaign.update({ where: { id: campaign.id }, data: { status: "CLOSED", publishedAt: start } });
        await notifyCampaign(tx, campaign.id, actorId, "CLOSED");
        await tx.notification.updateMany({ where: { body: { startsWith: `${title}. ` } }, data: { createdAt: end, readAt: day(end, 1) } });
      }
    }
    for (const faculty of completeFaculties) {
      const homeIds = completeClasses.filter(c => c.facultyId === faculty.id).map(c => c.id);
      await makeCampaign("closed", faculty.id, homeIds, 0);
      await makeCampaign("open", faculty.id, homeIds, 1);
      await makeCampaign("draft", faculty.id, homeIds.slice(0, 1), 1);
    }
    await makeCampaign("closed", null, [], 0);
    await makeCampaign("open", null, [], 1);
    await makeCampaign("draft", null, [], 1);
    await makeCampaign("scheduled", completeFaculties[0].id, [completeClasses[0].id], 1);
    await makeCampaign("cancelled", completeFaculties[1].id, [completeClasses[3].id], 1);
    assert.equal(await tx.user.count(), admins.length + 95);
    assert.equal(await tx.studentProfile.count(), 75);
    assert.equal(await tx.lecturerProfile.count(), 20);
    assert.equal(await tx.academicClass.count(), 15);
    assert.equal(await tx.courseClass.count(), 122);
    assert.equal(await tx.classStudyAssignment.count(), 120);
    assert.equal(await tx.surveyCampaign.count(), 20);
    assert.equal(await tx.submission.count(), 170);
    assert.equal(await tx.surveyParticipation.count(), 305);
    await tx.auditLog.create({ data: { actorId: actorId, action: "RESET_COMPLETE_DEMO", entity: "System", entityId: "demo-2026-11-06" } });
  }, { timeout: 180000, maxWait: 10000, isolationLevel: "Serializable" });
  return { admins, campaigns };
}
