import type { PrismaClient } from "@prisma/client";
import { average, ensureReportAvailable, participationRate } from "./report";

export async function getCampaignReport(db: PrismaClient, campaignId: string, lecturerId?: string) {
  const campaign = await db.surveyCampaign.findFirst({
    where: { id: campaignId, ...(lecturerId ? { targets: { some: { class: { lecturerId } } } } : {}) },
    include: {
      participations: { select: { status: true } },
      submissions: { include: { answers: { include: { question: { include: { options: true } } } } } },
      template: { include: { questions: { include: { options: true }, orderBy: { position: "asc" } } } },
      targets: { include: { class: { include: { course: true } } } }
    }
  });
  if (!campaign) throw new Error("Không tìm thấy báo cáo trong phạm vi được phân công.");
  const minimum = Number(process.env.MIN_REPORT_RESPONSES ?? 5);
  ensureReportAvailable(campaign.status, campaign.submissions.length, minimum);
  const rows = campaign.template.questions.map((question) => {
    const values = campaign.submissions.flatMap((submission) => submission.answers.filter((answer) => answer.questionId === question.id).map((answer) => answer.value));
    const strings = values.flatMap((value) => Array.isArray(value) ? value.map(String) : [String(value)]);
    return {
      id: question.id, content: question.content, type: question.type,
      average: question.type === "SCALE" ? average(strings.map(Number)) : undefined,
      distribution: question.type === "SINGLE" || question.type === "MULTIPLE" ? question.options.map((option) => ({ label: option.label, count: strings.filter((value) => value === option.value).length })) : undefined,
      comments: question.type === "TEXT" ? strings.filter(Boolean) : undefined
    };
  });
  const completed = campaign.participations.filter((item) => item.status === "COMPLETED").length;
  return { id: campaign.id, title: campaign.title, course: campaign.targets[0]?.class.course.name, invited: campaign.participations.length, completed, participationRate: participationRate(completed, campaign.participations.length), responses: campaign.submissions.length, questions: rows };
}
