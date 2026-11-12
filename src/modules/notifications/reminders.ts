import type { Prisma } from "@prisma/client";
import { isAcceptingResponses } from "@/modules/survey-campaign/rules";
import { deliverReminders } from "./automatic";

export async function remindPending(tx: Prisma.TransactionClient, campaignId: string, actorId: string, now = new Date()) {
  const campaign = await tx.surveyCampaign.findUniqueOrThrow({ where: { id: campaignId } });
  if (!isAcceptingResponses(campaign.status, campaign.startsAt, campaign.endsAt, now)) throw new Error("Chỉ nhắc khi đợt đang tiếp nhận phản hồi.");
  const recent = await tx.auditLog.findFirst({ where: { entity: "SurveyCampaign", entityId: campaignId, action: "REMIND_PENDING", createdAt: { gt: new Date(now.getTime() - 86400000) } } });
  if (recent) throw new Error("Đợt này đã được nhắc trong 24 giờ qua.");
  const count = await deliverReminders(tx, campaignId, now, false);
  if (!count) throw new Error("Không còn sinh viên cần nhắc hoặc đã được nhắc trong 24 giờ qua.");
  await tx.auditLog.create({ data: { actorId, action: "REMIND_PENDING", entity: "SurveyCampaign", entityId: campaignId } });
  return count;
}
