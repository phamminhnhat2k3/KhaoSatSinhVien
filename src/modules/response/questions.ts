import type { Question, QuestionOption } from "@prisma/client";

type FullQuestion = Question & { options: QuestionOption[] };
export type TeachingSection={courseId:string;lecturerId:string;course:{code:string;name:string};lecturer:{user:{name:string}}};
export function assignedQuestions(campaign: { evaluationMode?:string;template: { questions: FullQuestion[] }; courseTemplate?: { questions: FullQuestion[] } | null }, courses: { courseId: string; course: { code: string; name: string } }[] = [],teachings:TeachingSection[]=[]) {
  const common = campaign.template.questions.map(q => ({ ...q, questionId: q.id, courseId: null as string | null, lecturerId:null as string|null, sectionTitle: "Nội dung chung" }));
  const sections=campaign.evaluationMode==="LECTURER"?teachings.map(t=>({...t,key:`${t.courseId}:${t.lecturerId}`,name:`${t.course.code} · ${t.course.name} — ${t.lecturer.user.name}`})):courses.map(c=>({...c,lecturerId:null,key:c.courseId,name:`${c.course.code} · ${c.course.name}`}));
  const specific = sections.flatMap(c => (campaign.courseTemplate?.questions ?? []).map(q => ({ ...q, id: `${c.key}:${q.id}`, questionId: q.id, courseId: c.courseId as string | null, lecturerId:c.lecturerId as string|null, sectionTitle: c.name })));
  return [...common, ...specific];
}
