import type { PrismaClient } from "@prisma/client";
import { average, ensureReportAvailable, participationRate } from "./report";

export async function getCampaignReport(db: PrismaClient, campaignId: string, lecturerId?: string, facultyId?: string) {
  const campaign = await db.surveyCampaign.findUnique({
    where: { id: campaignId },
    include: {
      faculty: true,
      participations: { select: { status: true, courses: { select: { courseId: true } } } },
      submissions: { include: { answers: true } },
      template: { include: { questions: { include: { options: true }, orderBy: { position: "asc" } } } },
      courseTemplate: { include: { questions: { include: { options: true }, orderBy: { position: "asc" } } } },
      courseTargets: { include: { course: { include: { lecturers: { select: { id: true } }, classes: { select: { lecturerId: true, semesterId: true } } } } } },
      targets: { include: { class: { include: { course: true } } } }
    }
  });
  if (!campaign) throw new Error("Không tìm thấy báo cáo trong phạm vi được phân công.");
  if (facultyId && (campaign.scope !== "FACULTY" || campaign.facultyId !== facultyId)) throw new Error("Không tìm thấy báo cáo trong khoa được phân công.");
  const legacy = campaign.scope === "LEGACY_CLASS";
  const targets = campaign.courseTargets.filter(t => !lecturerId || t.course.lecturers?.some(l => l.id === lecturerId) || t.course.classes.some(c => c.lecturerId === lecturerId && c.semesterId === campaign.semesterId));
  if (lecturerId && (legacy ? !campaign.targets.some(t => t.class.lecturerId === lecturerId) : !targets.length)) throw new Error("Không tìm thấy báo cáo trong phạm vi được phân công.");
  const allowedCourses = new Set(targets.map(t => t.courseId));
  const participants = lecturerId && !legacy ? campaign.participations.filter(p => p.courses.some(c => allowedCourses.has(c.courseId))) : campaign.participations;
  const submissions = lecturerId && !legacy ? campaign.submissions.filter(s => s.answers.some(a => a.courseId && allowedCourses.has(a.courseId))) : campaign.submissions;
  const minimum = Number(process.env.MIN_REPORT_RESPONSES ?? 5);
  ensureReportAvailable(campaign.status, submissions.length, minimum);
  const sections = [
    ...(!lecturerId || legacy ? [{ courseId: null as string | null, name: "", questions: campaign.template.questions, invited: campaign.participations.length }] : []),
    ...targets.map(t => ({ courseId: t.courseId as string | null, name: `${t.course.code} · ${t.course.name}`, questions: campaign.courseTemplate?.questions ?? [], invited: campaign.participations.filter(p => p.courses.some(c => c.courseId === t.courseId)).length }))
  ];
  const rows = sections.flatMap(section => {
    const responded = campaign.submissions.filter(s => s.answers.some(a => a.courseId === section.courseId));
    if (section.courseId && responded.length < minimum) return [];
    return section.questions.map(question => {
      const values = responded.flatMap(s => s.answers.filter(a => a.questionId === question.id && a.courseId === section.courseId).map(a => a.value));
      const strings = values.flatMap(value => Array.isArray(value) ? value.map(String) : [String(value)]).filter(value => value !== "");
      return {
        id: section.courseId ? `${section.courseId}:${question.id}` : question.id,
        courseId: section.courseId, content: section.name ? `${section.name} — ${question.content}` : question.content,
        type: question.type, scaleMin: question.scaleMin, scaleMax: question.scaleMax,
        respondents: responded.length, invited: section.invited,
        average: question.type === "SCALE" ? average(strings.map(Number)) : undefined,
        distribution: question.type === "SINGLE" || question.type === "MULTIPLE" ? question.options.map(o => ({ label: o.label, count: strings.filter(v => v === o.value).length })) : undefined,
        comments: question.type === "TEXT" ? strings : undefined
      };
    });
  });
  if (!rows.length) throw new Error(`Các môn thuộc phạm vi chưa đủ tối thiểu ${minimum} phản hồi để mở báo cáo.`);
  const completed = participants.filter(p => p.status === "COMPLETED").length;
  return { id: campaign.id, title: campaign.title, course: legacy ? campaign.targets[0]?.class.course.name : campaign.faculty?.name ?? "Toàn trường", invited: participants.length, completed, participationRate: participationRate(completed, participants.length), responses: submissions.length, questions: rows };
}
