import type { PrismaClient } from "@prisma/client";
import { average, ensureReportAvailable, participationRate } from "./report";
import {canViewCourseResult} from "./teaching-scope";

export async function getCampaignReport(db: PrismaClient, campaignId: string, lecturerId?: string, facultyId?: string) {
  const campaign = await db.surveyCampaign.findUnique({
    where: { id: campaignId },
    include: {
      faculty: true,
      semester: true,
      participations: { select: {teachings:{include:{course:true,lecturer:{select:{user:{select:{name:true}}}}}}, status: true, courses: { select: { courseId: true } } } },
      submissions: { include: { answers: true } },
      template: { include: { questions: { include: { options: true }, orderBy: { position: "asc" } } } },
      courseTemplate: { include: { questions: { include: { options: true }, orderBy: { position: "asc" } } } },
      courseTargets: { include: { course: { include: { classes: { select: { lecturerId: true, semesterId: true,teachingConfigured:true,teachings:{select:{lecturerId:true}} } } } } } },
      targets: { include: { class: { include: { course: true } } } }
    }
  });
  if (!campaign) throw new Error("Không tìm thấy báo cáo trong phạm vi được phân công.");
  if (facultyId && (campaign.scope !== "FACULTY" || campaign.facultyId !== facultyId)) throw new Error("Không tìm thấy báo cáo trong khoa được phân công.");
  const legacy = campaign.scope === "LEGACY_CLASS";
  const byTeacher=campaign.evaluationMode==="LECTURER";
  const targets = campaign.courseTargets.filter(t => !lecturerId || canViewCourseResult(t.course,lecturerId,campaign.semesterId));
  const teachings=[...new Map(campaign.participations.flatMap(p=>p.teachings??[]).map(t=>[`${t.courseId}:${t.lecturerId}`,t])).values()].filter(t=>!lecturerId||t.lecturerId===lecturerId);
  if (lecturerId && (legacy ? !campaign.targets.some(t => t.class.lecturerId === lecturerId) : byTeacher?!teachings.length:!targets.length)) throw new Error("Không tìm thấy báo cáo trong phạm vi được phân công.");
  const allowedCourses = new Set(targets.map(t => t.courseId));
  const participants = lecturerId && !legacy ? campaign.participations.filter(p => byTeacher?(p.teachings??[]).some(t=>t.lecturerId===lecturerId):p.courses.some(c => allowedCourses.has(c.courseId))) : campaign.participations;
  const submissions = lecturerId && !legacy ? campaign.submissions.filter(s => s.answers.some(a => byTeacher?a.lecturerId===lecturerId:a.courseId && allowedCourses.has(a.courseId))) : campaign.submissions;
  const minimum = Number(process.env.MIN_REPORT_RESPONSES ?? 5);
  ensureReportAvailable(campaign.status, submissions.length, minimum, campaign.endsAt);
  const sections = [
    ...(!lecturerId || legacy ? [{ courseId: null as string | null,lecturerId:null as string|null, name: "", questions: campaign.template.questions, invited: campaign.participations.length }] : []),
    ...(byTeacher?teachings.map(t=>({courseId:t.courseId as string|null,lecturerId:t.lecturerId as string|null,name:`${t.course.code} · ${t.course.name} — ${t.lecturer.user.name}`,questions:campaign.courseTemplate?.questions??[],invited:campaign.participations.filter(p=>(p.teachings??[]).some(x=>x.courseId===t.courseId&&x.lecturerId===t.lecturerId)).length})):targets.map(t => ({ courseId: t.courseId as string | null,lecturerId:null as string|null, name: `${t.course.code} · ${t.course.name}`, questions: campaign.courseTemplate?.questions ?? [], invited: campaign.participations.filter(p => p.courses.some(c => c.courseId === t.courseId)).length })))
  ];
  const rows = sections.flatMap(section => {
    const responded = campaign.submissions.filter(s => s.answers.some(a => a.courseId === section.courseId && (a.lecturerId??null)===section.lecturerId));
    if (section.courseId && responded.length < minimum) return [];
    return section.questions.map(question => {
      const values = responded.flatMap(s => s.answers.filter(a => a.questionId === question.id && a.courseId === section.courseId && (a.lecturerId??null)===section.lecturerId).map(a => a.value)).filter(value => Array.isArray(value) ? value.length > 0 : value != null && String(value).trim() !== "");
      const strings = values.flatMap(value => Array.isArray(value) ? value.map(String) : [String(value)]).filter(value => value !== "");
      const respondents = values.filter(value=>Array.isArray(value)?value.length>0:value!==""&&value!==null).length;
      const suppressed = respondents < minimum;
      return {
        id: section.courseId ? `${section.courseId}:${section.lecturerId?`${section.lecturerId}:`:""}${question.id}` : question.id,
        courseId: section.courseId,lecturerId:section.lecturerId,sectionId:section.courseId?`${section.courseId}${section.lecturerId?`:${section.lecturerId}`:""}`:"common", content: section.name ? `${section.name} — ${question.content}` : question.content,
        type: question.type, scaleMin: question.scaleMin, scaleMax: question.scaleMax,
        sectionTitle: section.name || "Nội dung chung", suppressed,
        respondents, invited: section.invited,
        average: !suppressed && question.type === "SCALE" ? average(strings.map(Number)) : undefined,
        distribution: !suppressed && (question.type === "SINGLE" || question.type === "MULTIPLE") ? question.options.map(o => ({ label: o.label, count: strings.filter(v => v === o.value).length })) : undefined,
        comments: !suppressed && question.type === "TEXT" ? strings : undefined
      };
    });
  });
  if (!rows.length) throw new Error(`Các môn thuộc phạm vi chưa đủ tối thiểu ${minimum} phản hồi để mở báo cáo.`);
  const completed = participants.filter(p => p.status === "COMPLETED").length;
  return { id: campaign.id, title: campaign.title, semester:campaign.semester?.name??"Đợt khảo sát cũ",startsAt:campaign.startsAt.toISOString(),endsAt:campaign.endsAt.toISOString(),evaluationMode:byTeacher?"LECTURER":"COURSE",minimum,sections:sections.filter(s=>s.questions.length).map(s=>({id:s.courseId?`${s.courseId}${s.lecturerId?`:${s.lecturerId}`:""}`:"common",title:s.name||"Nội dung chung",invited:s.invited,responses:campaign.submissions.filter(sub=>sub.answers.some(a=>a.courseId===s.courseId&&(a.lecturerId??null)===s.lecturerId)).length})),course: legacy ? campaign.targets[0]?.class.course.name : campaign.faculty?.name ?? "Toàn trường", invited: participants.length, completed, participationRate: participationRate(completed, participants.length), responses: submissions.length, questions: rows };
}
