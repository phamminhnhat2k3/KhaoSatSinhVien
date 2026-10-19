import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getCampaignReport } from "@/modules/reporting/service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !session.user.roles.some((role) => role === Role.ADMIN || role === Role.LECTURER)) return Response.json({ code: "FORBIDDEN", message: "Không có quyền truy cập." }, { status: 403 });
  try {
    const lecturer = session.user.roles.includes(Role.ADMIN) ? undefined : await db.lecturerProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
    return Response.json(await getCampaignReport(db, (await params).id, lecturer?.id));
  } catch (error) { return Response.json({ code: "REPORT_UNAVAILABLE", message: error instanceof Error ? error.message : "Không thể mở báo cáo." }, { status: 400 }); }
}
