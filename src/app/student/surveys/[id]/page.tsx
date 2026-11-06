import Link from "next/link";
import {isAcceptingResponses} from "@/modules/survey-campaign/rules";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { SurveyForm } from "@/components/SurveyForm";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import type { SurveyAnswers } from "@/modules/response/rules";
import { assignedQuestions } from "@/modules/response/questions";

export default async function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(Role.STUDENT);
  const student = await db.studentProfile.findUniqueOrThrow({ where: { userId: user.id } });
  const participation = await db.surveyParticipation.findUnique({ where: { campaignId_studentId: { campaignId: (await params).id, studentId: student.id } }, include: { teachings:{include:{course:true,lecturer:{select:{user:{select:{name:true}}}}}},courses: { include: { course: true }, orderBy: { course: { code: "asc" } } }, campaign: { include: { faculty: true, semester: true, template: { include: { questions: { include: { options: { orderBy: { position: "asc" } } }, orderBy: { position: "asc" } } } }, courseTemplate: { include: { questions: { include: { options: { orderBy: { position: "asc" } } }, orderBy: { position: "asc" } } } } } } } });
  if (!participation || participation.status === "COMPLETED" || !isAcceptingResponses(participation.campaign.status,participation.campaign.startsAt,participation.campaign.endsAt)) notFound();
  return <AppShell name={user.name} role="Sinh viên" wide compact><Link className="text-button" href="/student">← Khảo sát của tôi</Link><p className="eyebrow">{participation.campaign.faculty?.name ?? (participation.campaign.scope === "UNIVERSITY" ? "Khảo sát toàn trường" : "Phiếu khảo sát")} · {participation.campaign.semester?.name}</p><h1>{participation.campaign.title}</h1><p className="lead">Trả lời lần lượt từng phần. Câu có dấu * là bắt buộc, bạn có thể lưu nháp để làm tiếp sau.</p><SurveyForm campaignId={participation.campaignId} questions={assignedQuestions(participation.campaign, participation.courses,participation.teachings)} draft={(participation.draft ?? {}) as SurveyAnswers}/></AppShell>;
}
