"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Role } from "@prisma/client";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";

const campaignSchema = z.object({ title: z.string().trim().min(3).max(120), classId: z.string().min(1), startsAt: z.coerce.date(), endsAt: z.coerce.date() }).refine((v) => v.endsAt > v.startsAt, "Thời gian kết thúc phải sau thời gian bắt đầu.");

const templateSchema = z.object({ title: z.string().trim().min(3).max(120), scale: z.string().trim().min(3), single: z.string().trim().min(3), multiple: z.string().trim().min(3), text: z.string().trim().min(3) });

export async function createTemplate(_: string | undefined, formData: FormData) {
  const user = await requireUser(Role.ADMIN);
  const parsed = templateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0].message;
  const template = await db.surveyTemplate.create({ data: { title: parsed.data.title, questions: { create: [
    { content: parsed.data.scale, type: "SCALE", position: 1 },
    { content: parsed.data.single, type: "SINGLE", position: 2, options: { create: [{ label: "Rất tốt", value: "excellent", position: 1 }, { label: "Tốt", value: "good", position: 2 }, { label: "Cần cải thiện", value: "improve", position: 3 }] } },
    { content: parsed.data.multiple, type: "MULTIPLE", position: 3, options: { create: [{ label: "Nội dung", value: "content", position: 1 }, { label: "Tài liệu", value: "material", position: 2 }, { label: "Tương tác", value: "interaction", position: 3 }] } },
    { content: parsed.data.text, type: "TEXT", position: 4, required: false }
  ] } } });
  await db.auditLog.create({ data: { actorId: user.id, action: "CREATE", entity: "SurveyTemplate", entityId: template.id } });
  revalidatePath("/admin");
}

export async function createCampaign(_: string | undefined, formData: FormData) {
  const user = await requireUser(Role.ADMIN);
  const parsed = campaignSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0].message;
  const template = await db.surveyTemplate.findFirst({ orderBy: { createdAt: "desc" } });
  if (!template) return "Chưa có mẫu khảo sát.";
  await db.$transaction(async (tx) => {
    const campaign = await tx.surveyCampaign.create({ data: { title: parsed.data.title, templateId: template.id, startsAt: parsed.data.startsAt, endsAt: parsed.data.endsAt, targets: { create: { classId: parsed.data.classId } } } });
    const enrollments = await tx.enrollment.findMany({ where: { classId: parsed.data.classId }, select: { studentId: true } });
    await tx.surveyParticipation.createMany({ data: enrollments.map(({ studentId }) => ({ campaignId: campaign.id, studentId })) });
    await tx.auditLog.create({ data: { actorId: user.id, action: "CREATE", entity: "SurveyCampaign", entityId: campaign.id } });
  });
  revalidatePath("/admin");
}

export async function publishCampaign(formData: FormData) {
  const user = await requireUser(Role.ADMIN);
  const id = z.string().min(1).parse(formData.get("id"));
  await db.$transaction([
    db.surveyCampaign.update({ where: { id, status: "DRAFT" }, data: { status: "PUBLISHED", publishedAt: new Date() } }),
    db.auditLog.create({ data: { actorId: user.id, action: "PUBLISH", entity: "SurveyCampaign", entityId: id } })
  ]);
  revalidatePath("/admin");
}

export async function closeCampaign(formData: FormData) {
  const user = await requireUser(Role.ADMIN);
  const id = z.string().min(1).parse(formData.get("id"));
  await db.$transaction([
    db.surveyCampaign.update({ where: { id, status: "PUBLISHED" }, data: { status: "CLOSED" } }),
    db.auditLog.create({ data: { actorId: user.id, action: "CLOSE", entity: "SurveyCampaign", entityId: id } })
  ]);
  revalidatePath("/admin");
}
