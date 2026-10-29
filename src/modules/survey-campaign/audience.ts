import type { Prisma } from "@prisma/client";

type Campaign = { id: string; scope: string; facultyId: string | null; semesterId: string | null; courseTargets: { courseId: string }[] };

export async function getAudience(tx: Pick<Prisma.TransactionClient, "studentProfile">, campaign: Campaign) {
  if (campaign.scope === "LEGACY_CLASS") return [];
  if (!campaign.semesterId || !["FACULTY", "UNIVERSITY"].includes(campaign.scope) || campaign.scope === "FACULTY" && !campaign.facultyId || campaign.scope === "UNIVERSITY" && (campaign.facultyId || campaign.courseTargets.length)) {
    throw new Error("Phạm vi, khoa hoặc học kỳ khảo sát không hợp lệ.");
  }
  return tx.studentProfile.findMany({
    where: { user: { active: true, roles: { some: { role: "STUDENT" } } }, ...(campaign.scope === "FACULTY" ? { academicClass: { facultyId: campaign.facultyId! } } : {}) },
    select: { id: true, studentCode: true, user: { select: { name: true } }, academicClass: { select: { code: true, faculty: { select: { name: true } } } }, enrollments: { where: { class: { semesterId: campaign.semesterId!, courseId: { in: campaign.courseTargets.map(c => c.courseId) } } }, select: { class: { select: { courseId: true, course: { select: { code: true, name: true } } } } } } },
    orderBy: { studentCode: "asc" }
  });
}

export async function publishToAudience(tx: Prisma.TransactionClient, id: string) {
  // Updating the draft first serializes concurrent publication attempts in this transaction.
  const campaign = await tx.surveyCampaign.update({ where: { id, status: "DRAFT" }, data: { status: "PUBLISHED", publishedAt: new Date() }, include: { courseTargets: true } });
  if (campaign.scope === "LEGACY_CLASS") return;
  const courseIds = [...new Set(campaign.courseTargets.map(c => c.courseId))];
  if (courseIds.length) {
    const matching = await tx.course.count({ where: { id: { in: courseIds }, facultyId: campaign.facultyId, classes: { some: { semesterId: campaign.semesterId ?? "" } } } });
    if (matching !== courseIds.length) throw new Error("Môn học đã thay đổi khoa hoặc không còn lớp trong học kỳ khảo sát. Kiểm tra lại trước khi công bố.");
  }
  const students = await getAudience(tx, campaign);
  if (!students.length) throw new Error("Chưa có sinh viên đang hoạt động trong phạm vi đã chọn. Kiểm tra khoa/lớp hành chính trước khi công bố.");
  await tx.surveyParticipation.createMany({ data: students.map(s => ({ campaignId: id, studentId: s.id })) });
  const participations = await tx.surveyParticipation.findMany({ where: { campaignId: id }, select: { id: true, studentId: true } });
  const participationIds = new Map(participations.map(p => [p.studentId, p.id]));
  const courses = students.flatMap(s => [...new Set(s.enrollments.map(e => e.class.courseId))].map(courseId => ({ participationId: participationIds.get(s.id)!, courseId })));
  if (courses.length) await tx.participationCourse.createMany({ data: courses });
}
