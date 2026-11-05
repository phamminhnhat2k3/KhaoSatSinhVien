import type { Prisma } from "@prisma/client";
import { campaignSchema } from "./input";

export async function saveCampaignDraft(tx: Prisma.TransactionClient, actorId: string, input: unknown, id?: string) {
  const { courseIds, academicClassIds, facultyId, courseTemplateId, ...data } = campaignSchema.parse(input);
  const classIds = [...new Set(academicClassIds)];
  if (data.scope === "FACULTY" && await tx.academicClass.count({ where: { id: { in: classIds }, facultyId } }) !== classIds.length) throw new Error("Lớp hành chính phải thuộc khoa đã chọn.");
  const ids = [...new Set(courseIds)];
  const matching = await tx.course.count({ where: { id: { in: ids }, ...(data.scope === "FACULTY" ? { facultyId } : {}), classes: { some: { semesterId: data.semesterId } } } });
  if (matching !== ids.length) throw new Error("Môn học phải thuộc khoa và có lớp trong học kỳ đã chọn.");
  const fields = { ...data, facultyId: facultyId || null, courseTemplateId: courseTemplateId || null };
  const campaign = id
    ? await tx.surveyCampaign.update({ where: { id, status: "DRAFT", scope: { in: ["FACULTY","UNIVERSITY"] }, participations: { none: {} }, submissions: { none: {} } }, data: { ...fields, approvedAt: null, approvedBy: null, reviewNote: null, courseTargets: { deleteMany: {}, create: ids.map(courseId=>({courseId})) }, academicTargets: { deleteMany: {}, create: classIds.map(academicClassId=>({academicClassId})) } } })
    : await tx.surveyCampaign.create({ data: { ...fields, courseTargets: { create: ids.map(courseId=>({courseId})) }, academicTargets: { create: classIds.map(academicClassId=>({academicClassId})) } } });
  await tx.auditLog.create({ data: { actorId, action: id ? "UPDATE_DRAFT" : "CREATE", entity: "SurveyCampaign", entityId: campaign.id } });
  return campaign;
}

export async function cancelCampaignDraft(tx: Prisma.TransactionClient, actorId: string, id: string) {
  await tx.surveyCampaign.update({where:{id,status:"DRAFT"},data:{status:"CANCELLED",approvedAt:null,approvedBy:null}});
  await tx.auditLog.create({data:{actorId,action:"CANCEL_DRAFT",entity:"SurveyCampaign",entityId:id}});
}
