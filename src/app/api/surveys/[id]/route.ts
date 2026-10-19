import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.roles.includes(Role.STUDENT)) return Response.json({ code: "FORBIDDEN", message: "Không có quyền truy cập." }, { status: 403 });
  const student = await db.studentProfile.findUnique({ where: { userId: session.user.id } });
  const participation = student && await db.surveyParticipation.findUnique({ where: { campaignId_studentId: { campaignId: (await params).id, studentId: student.id } }, include: { campaign: { include: { template: { include: { questions: { include: { options: true }, orderBy: { position: "asc" } } } } } } } });
  return participation ? Response.json(participation) : Response.json({ code: "NOT_FOUND", message: "Không tìm thấy khảo sát được giao." }, { status: 404 });
}
