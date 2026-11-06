import type { Prisma, PrismaClient } from "@prisma/client";
import { getCampaignReport } from "./service";
import { campaignPhase, campaignPhaseLabels } from "@/modules/survey-campaign/rules";

export async function getEntityEvaluations(db: PrismaClient, type: string, id: string, page: number, campaignId?: string) {
  let studentId: string | undefined, lecturerId: string | undefined;
  if (type === "user") {
    const user = await db.user.findUnique({ where: { id }, select: { student: { select: { id: true } }, lecturer: { select: { id: true } } } });
    if (!user) throw new Error("Không tìm thấy đối tượng.");
    studentId = user.student?.id;
    lecturerId = user.lecturer?.id;
    if (!studentId && !lecturerId) return { kind: "other" as const, total: 0, page: 1, pages: 1, items: [], report: null };
  } else if (type === "faculty") {
    if (!await db.faculty.findUnique({ where: { id }, select: { id: true } })) throw new Error("Không tìm thấy đối tượng.");
  } else if (type === "course") {
    if (!await db.course.findUnique({ where: { id }, select: { id: true } })) throw new Error("Không tìm thấy đối tượng.");
  } else throw new Error("Đối tượng không hợp lệ.");

  if (studentId) {
    const where = { studentId, status: "COMPLETED" as const };
    const total = await db.surveyParticipation.count({ where });
    const pages = Math.max(1, Math.ceil(total / 10)), current = Math.min(page, pages);
    const rows = await db.surveyParticipation.findMany({ where, skip: (current - 1) * 10, take: 10, orderBy: [{ completedAt: "desc" }, { id: "asc" }], select: { id: true, completedAt: true, campaign: { select: { title: true, semester: { select: { name: true } } } } } });
    return { kind: "student" as const, total, page: current, pages, items: rows.map(row => ({ id: row.id, title: row.campaign.title, semester: row.campaign.semester?.name ?? "Không gắn học kỳ", detail: row.completedAt ? `Đã gửi ${row.completedAt.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}` : "Đã gửi" })), report: null };
  }

  const where: Prisma.SurveyCampaignWhereInput = {
    status: { in: ["PUBLISHED", "CLOSED"] },
    ...(lecturerId ? { evaluationMode: "LECTURER", participations: { some: { teachings: { some: { lecturerId } } } } }
      : type === "faculty" ? { scope: "FACULTY", facultyId: id }
      : { OR: [{ courseTargets: { some: { courseId: id } } }, { targets: { some: { class: { courseId: id } } } }, { participations: { some: { teachings: { some: { courseId: id } } } } }] }),
  };
  const total = await db.surveyCampaign.count({ where });
  const pages = Math.max(1, Math.ceil(total / 10)), current = Math.min(page, pages);
  const rows = await db.surveyCampaign.findMany({ where, skip: (current - 1) * 10, take: 10, orderBy: [{ createdAt: "desc" }, { id: "asc" }], select: { id: true, title: true, status: true, startsAt: true, endsAt: true, semester: { select: { name: true } } } });
  let report: Awaited<ReturnType<typeof getCampaignReport>> | null = null;
  if (campaignId) {
    if (!await db.surveyCampaign.findFirst({ where: { ...where, id: campaignId }, select: { id: true } })) throw new Error("Không tìm thấy báo cáo trong phạm vi đối tượng.");
    report = await getCampaignReport(db, campaignId, lecturerId, type === "faculty" ? id : undefined);
    if (type === "course") {
      report.questions = report.questions.filter(q => q.courseId === id);
      report.sections = report.sections.filter(s => s.id === id || s.id.startsWith(`${id}:`));
      if (!report.sections.length) throw new Error("Chưa có phần đánh giá riêng cho môn này.");
    }
  }
  return { kind: lecturerId ? "lecturer" as const : type === "faculty" ? "faculty" as const : "course" as const, total, page: current, pages, items: rows.map(row => ({ id: row.id, title: row.title, semester: row.semester?.name ?? "Không gắn học kỳ", detail: campaignPhaseLabels[campaignPhase(row)] })), report };
}
