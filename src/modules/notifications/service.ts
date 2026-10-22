import type { Prisma } from "@prisma/client";

export async function notifyCampaign(tx: Prisma.TransactionClient, campaignId: string, actorId: string, event: "PUBLISHED" | "CLOSED") {
  const campaign = await tx.surveyCampaign.findUniqueOrThrow({ where: { id: campaignId }, include: { targets: { include: { class: { include: { lecturer: true } } } }, participations: { include: { student: true } } } });
  const recipients = new Map<string, string>();
  for (const p of campaign.participations) recipients.set(p.student.userId, "/student");
  for (const t of campaign.targets) recipients.set(t.class.lecturer.userId, event === "CLOSED" ? `/lecturer?campaign=${campaignId}` : "/lecturer");
  recipients.set(actorId, "/admin");
  await tx.notification.createMany({ data: [...recipients].map(([userId, href]) => ({ userId, href, title: event === "PUBLISHED" ? "Đợt khảo sát đã được công bố" : "Đợt khảo sát đã đóng", body: `${campaign.title}. ${event === "PUBLISHED" ? `Thời gian tiếp nhận: ${campaign.startsAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} – ${campaign.endsAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}.` : "Báo cáo chỉ được mở khi đủ ngưỡng ẩn danh."}` })) });
}

export async function markRead(db: Pick<Prisma.TransactionClient, "notification">, userId: string, id?: string) {
  return db.notification.updateMany({ where: { userId, readAt: null, ...(id ? { id } : {}) }, data: { readAt: new Date() } });
}
