import type { Prisma } from "@prisma/client";
import { campaignSchema } from "./input";

export async function saveCampaignDraft(tx: Prisma.TransactionClient, actorId: string, input: unknown, id?: string) {
  const { courseIds, facultyId, courseTemplateId, ...data } = campaignSchema.parse(input);
  const ids = [...new Set(courseIds)];
  const matching = await tx.course.count({ where: { id: { in: ids }, ...(data.scope === "FACULTY" ? { facultyId } : {}), classes: { some: { semesterId: data.semesterId } } } });
  if (matching !== ids.length) throw new Error("Môn học phải thuộc khoa và có lớp trong học kỳ đã chọn.");
  const fields = { ...data, facultyId: facultyId || null, courseTemplateId: courseTemplateId || null };
  const campaign = id
    ? await tx.surveyCampaign.update({ where: { id, status: "DRAFT", scope: { in: ["FACULTY","UNIVERSITY"] }, participations: { none: {} }, submissions: { none: {} } }, data: { ...fields, approvedAt: null, approvedBy: null, reviewNote: null, courseTargets: { deleteMany: {}, create: ids.map(courseId=>({courseId})) } } })
    : await tx.surveyCampaign.create({ data: { ...fields, courseTargets: { create: ids.map(courseId=>({courseId})) } } });
  await tx.auditLog.create({ data: { actorId, action: id ? "UPDATE_DRAFT" : "CREATE", entity: "SurveyCampaign", entityId: campaign.id } });
  if (facultyId) {
    const deans = await tx.lecturerProfile.findMany({ where: { facultyId, user: { active: true, roles: { some: { role: "DEAN" } } } }, select: { userId: true } });
    await tx.notification.createMany({ data: deans.map(d=>({userId:d.userId,title:id?"Đợt khảo sát đã sửa, cần xét duyệt lại":"Đợt khảo sát chờ xét duyệt",body:campaign.title,href:"/dean"})) });
  }
  return campaign;
}

export async function cancelCampaignDraft(tx: Prisma.TransactionClient, actorId: string, id: string) {
  await tx.surveyCampaign.update({where:{id,status:"DRAFT"},data:{status:"CANCELLED",approvedAt:null,approvedBy:null}});
  await tx.auditLog.create({data:{actorId,action:"CANCEL_DRAFT",entity:"SurveyCampaign",entityId:id}});
}
