import type { Question, QuestionOption } from "@prisma/client";

type FullQuestion = Question & { options: QuestionOption[] };
export function assignedQuestions(campaign: { template: { questions: FullQuestion[] }; courseTemplate?: { questions: FullQuestion[] } | null }, courses: { courseId: string; course: { code: string; name: string } }[] = []) {
  const common = campaign.template.questions.map(q => ({ ...q, questionId: q.id, courseId: null as string | null, sectionTitle: "Nội dung chung" }));
  const specific = courses.flatMap(c => (campaign.courseTemplate?.questions ?? []).map(q => ({ ...q, id: `${c.courseId}:${q.id}`, questionId: q.id, courseId: c.courseId as string | null, sectionTitle: `${c.course.code} · ${c.course.name}` })));
  return [...common, ...specific];
}
