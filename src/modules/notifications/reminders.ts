import type { Prisma } from "@prisma/client";
import { isAcceptingResponses } from "@/modules/survey-campaign/rules";

export async function remindPending(tx: Prisma.TransactionClient, campaignId: string, actorId: string, now = new Date()) {
  const campaign = await tx.surveyCampaign.findUniqueOrThrow({ where: { id: campaignId } });
  if (!isAcceptingResponses(campaign.status, campaign.startsAt, campaign.endsAt, now)) throw new Error("Chỉ nhắc khi đợt đang tiếp nhận phản hồi.");
  const recent = await tx.auditLog.findFirst({ where: { entity: "SurveyCampaign", entityId: campaignId, action: "REMIND_PENDING", createdAt: { gt: new Date(now.getTime() - 86400000) } } });
  if (recent) throw new Error("Đợt này đã được nhắc trong 24 giờ qua.");
  const pending = await tx.surveyParticipation.findMany({ where: { campaignId, status: { not: "COMPLETED" }, student: { user: { active: true, roles: { some: { role: "STUDENT" } } } } }, select: { student: { select: { userId: true } } } });
  if (!pending.length) throw new Error("Không còn sinh viên đang hoạt động cần nhắc.");
  await tx.notification.createMany({ data: pending.map(p => ({ userId: p.student.userId, title: "Nhắc hoàn thành khảo sát", body: `${campaign.title}. Hạn cuối: ${campaign.endsAt.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}. Nếu đã gửi phiếu, bạn có thể bỏ qua lời nhắc này.`, href: `/student/surveys/${campaignId}` })) });
  await tx.auditLog.create({ data: { actorId, action: "REMIND_PENDING", entity: "SurveyCampaign", entityId: campaignId } });
  return pending.length;
}
