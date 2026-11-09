import type { PrismaClient } from "@prisma/client";
import { getCampaignReport } from "./service";

export type ResultActor = { id: string; roles: string[]; facultyId?: string | null; lecturerId?: string | null };
export function resultRole(actor: ResultActor) { return actor.roles.includes("ADMIN") ? "ADMIN" : actor.roles.includes("DEAN") ? "DEAN" : "LECTURER"; }
export type ComparisonPoint = { question: string; min: number; max: number; step: number; average: number | null; respondents: number; baseline: number | null; attention: boolean };
export function comparisonPoints(rows: { content: string; average?: number; respondents: number; suppressed: boolean; scaleMin: number; scaleMax: number; scaleStep?: number }[][], labels: string[]) {
  return rows.map(teacher => teacher.map((r, index): ComparisonPoint => {
    const eligible = rows.map(group => group[index]).filter(x => x && !x.suppressed && x.average !== undefined);
    const total = eligible.reduce((n, x) => n + x.respondents, 0);
    const baseline = total ? Math.round(eligible.reduce((n, x) => n + x.average! * x.respondents, 0) / total * 100) / 100 : null;
    const value = !r.suppressed && r.average !== undefined ? r.average : null;
    return { question: labels[index], min: r.scaleMin, max: r.scaleMax, step: r.scaleStep ?? 1, average: value, respondents: r.respondents, baseline, attention: value !== null && r.scaleMax > r.scaleMin && (value-r.scaleMin)/(r.scaleMax-r.scaleMin) < 0.5 };
  }));
}

export async function getComparison(db: PrismaClient, actor: ResultActor, campaignId: string, courseId: string, selected: string[] = []) {
  const role = resultRole(actor);
  if (role === "DEAN" && !actor.facultyId || role === "LECTURER" && !actor.lecturerId) throw new Error("Tài khoản chưa được phân khoa hoặc giảng viên.");
  const report = await getCampaignReport(db, campaignId, role === "LECTURER" ? actor.lecturerId! : undefined, role === "DEAN" ? actor.facultyId! : undefined);
  if (report.evaluationMode !== "LECTURER") throw new Error("Đợt này đánh giá chung môn học, không có điểm riêng để so sánh giảng viên.");
  const campaign = await db.surveyCampaign.findUniqueOrThrow({ where: { id: campaignId }, include: { faculty: true, semester: true, courseTemplate: { include: { questions: { where: { type: "SCALE" }, orderBy: { position: "asc" } } } }, participations: { select: { teachings: { select: { lecturerId: true, courseId: true, course: true, lecturer: { select: { user: { select: { name: true } } } } } } } } } });
  const targets = [...new Map(campaign.participations.flatMap(p => p.teachings).filter(t => role !== "LECTURER" || t.lecturerId === actor.lecturerId).map(t => [`${t.courseId}:${t.lecturerId}`, t])).values()];
  const courses = [...new Map(targets.map(t => [t.courseId, { id: t.courseId, name: `${t.course.code} · ${t.course.name}` }])).values()];
  const course = courses.find(c => c.id === courseId) ?? (!courseId ? courses[0] : undefined);
  if (!course) throw new Error("Môn không thuộc phạm vi kết quả được phép xem.");
  const teachers = targets.filter(t => t.courseId === course.id);
  if (selected.some(id => !teachers.some(t => t.lecturerId === id))) throw new Error("Giảng viên không thuộc môn hoặc phạm vi được phép xem.");
  const questions = campaign.courseTemplate?.questions ?? [];
  const groups = teachers.map(t => questions.map(q => ({ ...report.questions.find(r => r.courseId === course.id && r.lecturerId === t.lecturerId && r.id.endsWith(`:${q.id}`)) ?? { content: q.content, respondents: 0, suppressed: true, scaleMin: q.scaleMin, scaleMax: q.scaleMax }, scaleStep: q.scaleStep })));
  const points = comparisonPoints(groups, questions.map(q => q.content));
  return { campaignId, semesterId: campaign.semesterId, title: campaign.title, faculty: campaign.faculty?.name ?? "", semester: campaign.semester?.name ?? "", course, courses, minimum: report.minimum,
    teachers: teachers.map((t, i) => ({ id: t.lecturerId, name: t.lecturer.user.name, invited: report.sections.find(s => s.id === `${course.id}:${t.lecturerId}`)?.invited ?? 0, responses: report.sections.find(s => s.id === `${course.id}:${t.lecturerId}`)?.responses ?? 0, points: points[i] })), selected: selected.length ? selected : teachers.map(t => t.lecturerId), comparison: role !== "LECTURER" };
}

export async function getResultTrend(db: PrismaClient, actor: ResultActor, current: Awaited<ReturnType<typeof getComparison>>, referenceId?: string) {
  if (!referenceId) return undefined;
  if (referenceId === current.campaignId) throw new Error("Chọn một đợt khác để so sánh theo thời gian.");
  const old = await getComparison(db, actor, referenceId, current.course.id);
  if (old.semesterId === current.semesterId) throw new Error("Chọn đợt thuộc học kỳ khác để so sánh theo thời gian.");
  return { referenceId, title: `${old.title} · ${old.semester}`, teachers: current.teachers.filter(t => current.selected.includes(t.id)).map(t => ({ name: t.name, points: t.points.map(p => {
    const matches = old.teachers.find(x => x.id === t.id)?.points.filter(x => x.question === p.question && x.min === p.min && x.max === p.max && x.step === p.step) ?? [];
    const unambiguous = t.points.filter(x => x.question === p.question && x.min === p.min && x.max === p.max && x.step === p.step).length === 1;
    const before = matches.length === 1 && unambiguous ? matches[0].average : null;
    return { question: p.question, before, after: p.average, difference: before !== null && p.average !== null ? Math.round((p.average-before)*100)/100 : null };
  }) })) };
}
