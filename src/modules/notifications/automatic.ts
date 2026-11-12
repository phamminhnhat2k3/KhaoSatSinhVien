import { createHash } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { isAcceptingResponses } from "@/modules/survey-campaign/rules";

export function reminderId(campaignId: string, userId: string, now: Date) {
  const day = now.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
  return `reminder-${createHash("sha256").update(`${campaignId}:${userId}:${day}`).digest("hex")}`;
}
export function pendingReminderWhere(campaignId: string, now: Date): Prisma.SurveyParticipationWhereInput {
  return { campaignId, status: { not: "COMPLETED" }, student: { user: { active: true, roles: { some: { role: "STUDENT" } }, notifications: { none: { href: `/student/surveys/${campaignId}`, title: { in: ["Nhắc hoàn thành khảo sát", "Nhắc hạn khảo sát tự động"] }, createdAt: { gt: new Date(now.getTime()-86400000) } } } } } };
}
export async function deliverReminders(tx: Prisma.TransactionClient, campaignId: string, now: Date, automatic: boolean) {
  const campaign = await tx.surveyCampaign.findUniqueOrThrow({ where: { id: campaignId } });
  if (!isAcceptingResponses(campaign.status, campaign.startsAt, campaign.endsAt, now)) return 0;
  const pending = await tx.surveyParticipation.findMany({ where: pendingReminderWhere(campaignId, now), select: { student: { select: { userId: true } } }, ...(automatic ? { take: 500 } : {}) });
  if (!pending.length) return 0;
  const result = await tx.notification.createMany({ skipDuplicates: true, data: pending.map(p => ({ id: reminderId(campaignId, p.student.userId, now), userId: p.student.userId, createdAt: now, title: automatic ? "Nhắc hạn khảo sát tự động" : "Nhắc hoàn thành khảo sát", body: `${campaign.title}. Hạn cuối: ${campaign.endsAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}. Vui lòng hoàn thành trước hạn. Nếu đã gửi phiếu, bạn có thể bỏ qua lời nhắc này.`, href: `/student/surveys/${campaignId}` })) });
  return result.count;
}
export async function runAutomaticReminders(db: PrismaClient, now = new Date()) {
  const campaigns = await db.surveyCampaign.findMany({ where: { status: "PUBLISHED", startsAt: { lte: now }, endsAt: { gte: now, lte: new Date(now.getTime()+3*86400000) } }, select: { id: true }, orderBy: { endsAt: "asc" } });
  let sent = 0;
  for (const campaign of campaigns) sent += await db.$transaction(tx => deliverReminders(tx, campaign.id, now, true), { isolationLevel: "Serializable" });
  return sent;
}
