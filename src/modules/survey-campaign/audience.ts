import type { Prisma } from "@prisma/client";
import {effectiveEnrollments} from "../academic/study-plan";
import {teachingPairs} from "./teaching";

type Campaign = { id: string; scope: string; facultyId: string | null; semesterId: string | null; evaluationMode?:string; courseTargets: { courseId: string }[]; academicTargets?: { academicClassId: string }[] };
const teacherSelect={id:true,facultyId:true,user:{select:{name:true,active:true,roles:{select:{role:true}}}}} as const;

export async function getAudience(tx: Pick<Prisma.TransactionClient, "studentProfile">, campaign: Campaign) {
  if (campaign.scope === "LEGACY_CLASS") return [];
  if (!campaign.semesterId || !["FACULTY", "UNIVERSITY"].includes(campaign.scope) || campaign.scope === "FACULTY" && !campaign.facultyId || campaign.scope === "UNIVERSITY" && (campaign.facultyId || campaign.courseTargets.length)) {
    throw new Error("Phạm vi, khoa hoặc học kỳ khảo sát không hợp lệ.");
  }
  const classIds = campaign.academicTargets?.map(t => t.academicClassId) ?? [];
  if (campaign.scope === "FACULTY" && !classIds.length) return [];
  const classFilter = { semesterId: campaign.semesterId, courseId: { in: campaign.courseTargets.map(c => c.courseId) } };
  const classSelect = { id: true, code: true, teachingConfigured: true, lecturer: { select: teacherSelect }, teachings: { select: { lecturer: { select: teacherSelect } } }, courseId: true, course: { select: { code: true, name: true } } } as const;
  const students = await tx.studentProfile.findMany({
    where: { user: { active: true, roles: { some: { role: "STUDENT" } } }, ...(campaign.scope === "FACULTY" ? { academicClass: { facultyId: campaign.facultyId!, ...(classIds.length ? { id: { in: classIds } } : {}) } } : {}) },
    select: {
      id: true, studentCode: true, user: { select: { name: true } },
      studyPlans: { where: { semesterId: campaign.semesterId }, select: { semesterId: true } },
      academicClass: { select: { code: true, faculty: { select: { name: true } }, studyAssignments: { where: { class: classFilter }, select: { class: { select: classSelect } } } } },
      enrollments: { where: { class: classFilter }, select: { class: { select: classSelect } } }
    },
    orderBy: { studentCode: "asc" }
  });
  return students.map(s => ({ ...s, enrollments: effectiveEnrollments(s.academicClass?.studyAssignments ?? [], s.enrollments, !!s.studyPlans?.length) }));
}

export async function publishToAudience(tx: Prisma.TransactionClient, id: string) {
  // Updating the draft first serializes concurrent publication attempts in this transaction.
  const campaign = await tx.surveyCampaign.update({ where: { id, status: "DRAFT" }, data: { status: "PUBLISHED", publishedAt: new Date() }, include: { courseTargets: true, academicTargets: true } });
  if (campaign.scope === "LEGACY_CLASS") return;
  const selectedClasses = campaign.academicTargets.map(t => t.academicClassId);
  if (campaign.scope === "FACULTY" && (!selectedClasses.length || await tx.academicClass.count({ where: { id: { in: selectedClasses }, facultyId: campaign.facultyId! } }) !== selectedClasses.length)) {
    throw new Error("Lớp hành chính nhận khảo sát chưa được chọn hoặc không còn thuộc khoa. Chỉnh sửa bản nháp trước khi công bố.");
  }
  const courseIds = [...new Set(campaign.courseTargets.map(c => c.courseId))];
  if (courseIds.length) {
    const matching = await tx.course.count({ where: { id: { in: courseIds }, facultyId: campaign.facultyId, classes: { some: { semesterId: campaign.semesterId ?? "" } } } });
    if (matching !== courseIds.length) throw new Error("Môn học đã thay đổi khoa hoặc không còn lớp trong học kỳ khảo sát. Kiểm tra lại trước khi công bố.");
  }
  const students = await getAudience(tx, campaign);
  if (!students.length) throw new Error("Chưa có sinh viên đang hoạt động trong phạm vi đã chọn. Kiểm tra khoa/lớp hành chính trước khi công bố.");
  const teachingAssignments=campaign.evaluationMode==="LECTURER"?new Map(students.map(s=>[s.id,teachingPairs(s.enrollments,campaign.facultyId)])):null;
  await tx.surveyParticipation.createMany({ data: students.map(s => ({ campaignId: id, studentId: s.id })) });
  const participations = await tx.surveyParticipation.findMany({ where: { campaignId: id }, select: { id: true, studentId: true } });
  const participationIds = new Map(participations.map(p => [p.studentId, p.id]));
  const courses = students.flatMap(s => [...new Set(s.enrollments.map(e => e.class.courseId))].map(courseId => ({ participationId: participationIds.get(s.id)!, courseId })));
  if (courses.length) await tx.participationCourse.createMany({ data: courses });
  if(teachingAssignments){
    const data=students.flatMap(s=>(teachingAssignments.get(s.id)??[]).map(t=>({...t,participationId:participationIds.get(s.id)!})));
    if(data.length)await tx.participationTeaching.createMany({data});
  }
}
