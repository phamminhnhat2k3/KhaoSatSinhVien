import type { Prisma } from "@prisma/client";

export async function notifyCampaign(tx: Prisma.TransactionClient, campaignId: string, actorId: string, event: "PUBLISHED" | "CLOSED") {
  const campaign = await tx.surveyCampaign.findUniqueOrThrow({ where: { id: campaignId }, include: { courseTargets: { include: { course: { include: { lecturers: true, classes: { include: { lecturer: true, teachings: { include: { lecturer: true } } } } } } } }, targets: { include: { class: { include: { lecturer: true } } } }, participations: { include: { student: true,teachings:{include:{lecturer:{select:{userId:true}}}} } } } });
  const recipients = new Map<string, string>();
  const lecturerHref = event === "CLOSED" ? `/lecturer?campaign=${campaignId}` : "/lecturer";
  for (const p of campaign.participations) recipients.set(p.student.userId, "/student");
  for (const t of campaign.targets) if (t.class.lecturer) recipients.set(t.class.lecturer!.userId, event === "CLOSED" ? `/lecturer?campaign=${campaignId}` : "/lecturer");
  if(campaign.evaluationMode!=="LECTURER")for (const t of campaign.courseTargets ?? []) for (const c of t.course.classes) if (c.semesterId === campaign.semesterId) {
    if (c.lecturer && !c.teachingConfigured) recipients.set(c.lecturer.userId, lecturerHref);
    for (const teaching of c.teachings ?? []) recipients.set(teaching.lecturer.userId, lecturerHref);
  }
  if(campaign.evaluationMode!=="LECTURER")for (const t of campaign.courseTargets ?? []) for (const l of t.course.lecturers ?? []) recipients.set(l.userId, lecturerHref);
  if(campaign.evaluationMode==="LECTURER")for(const p of campaign.participations)for(const t of p.teachings??[])recipients.set(t.lecturer.userId,event==="CLOSED"?`/lecturer?campaign=${campaignId}`:"/lecturer");
  if (campaign.facultyId) {
    const deans = await tx.lecturerProfile.findMany({ where: { facultyId: campaign.facultyId, user: { active: true, roles: { some: { role: "DEAN" } } } }, select: { userId: true } });
    for (const d of deans) recipients.set(d.userId, event === "CLOSED" ? `/dean?campaign=${campaignId}` : "/dean");
  }
  recipients.set(actorId, "/admin");
  await tx.notification.createMany({ data: [...recipients].map(([userId, href]) => ({ userId, href, title: event === "PUBLISHED" ? "Đợt khảo sát đã được công bố" : "Đợt khảo sát đã đóng", body: `${campaign.title}. ${event === "PUBLISHED" ? `Thời gian tiếp nhận: ${campaign.startsAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} – ${campaign.endsAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}.` : "Báo cáo chỉ được mở khi đủ ngưỡng ẩn danh."}` })) });
}

export async function markRead(db: Pick<Prisma.TransactionClient, "notification">, userId: string, id?: string) {
  return db.notification.updateMany({ where: { userId, readAt: null, ...(id ? { id } : {}) }, data: { readAt: new Date() } });
}
