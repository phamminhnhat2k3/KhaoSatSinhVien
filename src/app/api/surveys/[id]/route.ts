import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { assignedQuestions } from "@/modules/response/questions";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.roles.includes(Role.STUDENT)) return Response.json({ code: "FORBIDDEN", message: "Không có quyền truy cập." }, { status: 403 });
  const student = await db.studentProfile.findUnique({ where: { userId: session.user.id } });
  const participation = student && await db.surveyParticipation.findUnique({ where: { campaignId_studentId: { campaignId: (await params).id, studentId: student.id } }, include: { courses: { include: { course: true }, orderBy: { course: { code: "asc" } } }, campaign: { include: { faculty: true, semester: true, template: { include: { questions: { include: { options: true }, orderBy: { position: "asc" } } } }, courseTemplate: { include: { questions: { include: { options: true }, orderBy: { position: "asc" } } } } } } } });
  return participation ? Response.json({ id: participation.id, status: participation.status, draft: participation.draft, campaign: { id: participation.campaign.id, title: participation.campaign.title, scope: participation.campaign.scope, startsAt: participation.campaign.startsAt, endsAt: participation.campaign.endsAt, semester: participation.campaign.semester, faculty: participation.campaign.faculty }, questions: assignedQuestions(participation.campaign, participation.courses) }) : Response.json({ code: "NOT_FOUND", message: "Không tìm thấy khảo sát được giao." }, { status: 404 });
}
