import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { SurveyForm } from "@/components/SurveyForm";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import type { SurveyAnswers } from "@/modules/response/rules";

export default async function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(Role.STUDENT);
  const student = await db.studentProfile.findUniqueOrThrow({ where: { userId: user.id } });
  const participation = await db.surveyParticipation.findUnique({ where: { campaignId_studentId: { campaignId: (await params).id, studentId: student.id } }, include: { campaign: { include: { template: { include: { questions: { include: { options: { orderBy: { position: "asc" } } }, orderBy: { position: "asc" } } } } } } } });
  if (!participation || participation.status === "COMPLETED") notFound();
  return <AppShell name={user.name} role="Sinh viên"><p className="eyebrow">Phiếu khảo sát</p><h1>{participation.campaign.title}</h1><p className="lead">Các câu có dấu * là bắt buộc. Bạn có thể lưu bản nháp và quay lại trước hạn.</p><SurveyForm campaignId={participation.campaignId} questions={participation.campaign.template.questions} draft={(participation.draft ?? {}) as SurveyAnswers}/></AppShell>;
}
