import type { Prisma, PrismaClient } from "@prisma/client";
import { isAcceptingResponses } from "@/modules/survey-campaign/rules";
import { validateAnswers, type SurveyAnswers } from "./rules";

type Database = Pick<PrismaClient, "$transaction">;

export async function submitResponse(db: Database, campaignId: string, studentId: string, answers: SurveyAnswers, now = new Date()) {
  return db.$transaction(async (tx) => {
    const participation = await tx.surveyParticipation.findUnique({
      where: { campaignId_studentId: { campaignId, studentId } },
      include: { campaign: { include: { template: { include: { questions: { include: { options: true } } } } } } }
    });
    if (!participation) throw new Error("Bạn không thuộc đối tượng khảo sát.");
    if (participation.status === "COMPLETED") throw new Error("Bạn đã hoàn thành khảo sát này.");
    const { campaign } = participation;
    if (!isAcceptingResponses(campaign.status, campaign.startsAt, campaign.endsAt, now)) throw new Error("Khảo sát chưa mở hoặc đã hết hạn.");
    const questions = campaign.template.questions.map((q) => ({ id: q.id, type: q.type, required: q.required, optionValues: q.options.map((o) => o.value) }));
    const errors = validateAnswers(questions, answers);
    if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
    const submission = await tx.submission.create({
      data: { campaignId, answers: { create: Object.entries(answers).map(([questionId, value]) => ({ questionId, value: value as Prisma.InputJsonValue })) } }
    });
    await tx.surveyParticipation.update({ where: { id: participation.id }, data: { status: "COMPLETED", completedAt: now, draft: undefined } });
    return submission;
  });
}

export async function saveDraft(db: PrismaClient, campaignId: string, studentId: string, answers: SurveyAnswers) {
  const participation = await db.surveyParticipation.findUnique({ where: { campaignId_studentId: { campaignId, studentId } }, include: { campaign: true } });
  if (!participation || participation.status === "COMPLETED") throw new Error("Không thể lưu bản nháp này.");
  if (!isAcceptingResponses(participation.campaign.status, participation.campaign.startsAt, participation.campaign.endsAt)) throw new Error("Khảo sát chưa mở hoặc đã hết hạn.");
  return db.surveyParticipation.update({ where: { id: participation.id }, data: { status: "DRAFT", draft: answers as Prisma.InputJsonValue } });
}
