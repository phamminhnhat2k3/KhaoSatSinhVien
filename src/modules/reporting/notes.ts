import { z } from "zod";
import type { Prisma, PrismaClient } from "@prisma/client";
import { getComparison, getResultTrend, resultRole, type ResultActor } from "./comparison";

export const noteSchema = z.object({ id: z.string().max(150).default(""), campaignId: z.string().min(1).max(150), courseId: z.string().min(1).max(150), referenceId: z.string().max(150).optional(), lecturerIds: z.array(z.string().min(1).max(150)).min(1).max(100), title: z.string().trim().min(3).max(200), observation: z.string().trim().max(5000), plan: z.string().trim().max(5000), send: z.boolean() }).refine(v => !v.send || v.observation.length >= 10 && v.plan.length >= 10, "Nhận xét và kế hoạch cần ít nhất 10 ký tự trước khi gửi.");
export function noteVisibility(actor: ResultActor): Prisma.ResultNoteWhereInput {
  const own = { authorId: actor.id };
  if (resultRole(actor) === "ADMIN") return { OR: [own, { status: "SENT" }] };
  if (resultRole(actor) === "DEAN" && actor.facultyId) return { OR: [own, { status: "SENT", campaign: { scope: "FACULTY", facultyId: actor.facultyId } }] };
  return own;
}
export async function saveResultNote(db: PrismaClient, actor: ResultActor, input: unknown) {
  const data = noteSchema.parse(input);
  const comparison = await getComparison(db, actor, data.campaignId, data.courseId, data.lecturerIds);
  const trend = await getResultTrend(db, actor, comparison, data.referenceId);
  if (!comparison.teachers.filter(t => data.lecturerIds.includes(t.id)).some(t => t.points.some(p => p.average !== null))) throw new Error("Chưa có tiêu chí đủ ngưỡng để làm căn cứ nhận xét.");
  const role = resultRole(actor), kind = role === "LECTURER" ? "IMPROVEMENT" : "REVIEW";
  const snapshot = JSON.parse(JSON.stringify({ ...comparison, trend, teachers: comparison.teachers.filter(t => data.lecturerIds.includes(t.id)), courses: undefined, capturedAt: new Date().toISOString() })) as Prisma.InputJsonValue;
  return db.$transaction(async tx => {
    if (data.id) {
      const old = await tx.resultNote.findUniqueOrThrow({ where: { id: data.id } });
      if (old.authorId !== actor.id || old.status !== "DRAFT" || old.campaignId !== data.campaignId || old.courseId !== data.courseId) throw new Error("Chỉ chỉnh sửa bản nháp của chính bạn. Bản đã gửi được giữ nguyên.");
    }
    const values = { campaignId: data.campaignId, authorId: actor.id, kind, courseId: data.courseId, lecturerId: role === "LECTURER" ? actor.lecturerId : null, title: data.title, observation: data.observation, plan: data.plan, status: data.send ? "SENT" : "DRAFT", sentAt: data.send ? new Date() : null, snapshot };
    const note = data.id ? await tx.resultNote.update({ where: { id: data.id, authorId: actor.id, status: "DRAFT" }, data: values }) : await tx.resultNote.create({ data: values });
    if (data.send) {
      const recipients = await tx.user.findMany({ where: { active: true, OR: [{ roles: { some: { role: "ADMIN" } } }, ...(role === "LECTURER" && actor.facultyId ? [{ roles: { some: { role: "DEAN" as const } }, lecturer: { facultyId: actor.facultyId } }] : [])] }, select: { id: true } });
      await tx.notification.createMany({ data: recipients.filter(u => u.id !== actor.id).map(u => ({ userId: u.id, title: kind === "REVIEW" ? "Nhận xét kết quả khảo sát mới" : "Hướng cải thiện của giảng viên", body: `${actor.id === u.id ? "" : "Có báo cáo mới: "}${note.title}`, href: `/results/notes/${note.id}` })) });
    }
    await tx.auditLog.create({ data: { actorId: actor.id, action: data.send ? "SEND_RESULT_NOTE" : "SAVE_RESULT_NOTE", entity: "ResultNote", entityId: note.id } });
    return note;
  }, { isolationLevel: "Serializable" });
}
