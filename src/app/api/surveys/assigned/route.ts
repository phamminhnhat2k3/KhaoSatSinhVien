import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user.roles.includes(Role.STUDENT)) return Response.json({ code: "FORBIDDEN", message: "Không có quyền truy cập." }, { status: 403 });
  const student = await db.studentProfile.findUnique({ where: { userId: session.user.id } });
  if (!student) return Response.json([]);
  const items = await db.surveyParticipation.findMany({ where: { studentId: student.id, campaign: { status: "PUBLISHED" } }, select: { status: true, _count: { select: { courses: true } }, campaign: { select: { id: true, title: true, startsAt: true, endsAt: true, scope: true, faculty: { select: { id: true, name: true } }, semester: { select: { id: true, name: true } } } } } });
  return Response.json(items);
}
