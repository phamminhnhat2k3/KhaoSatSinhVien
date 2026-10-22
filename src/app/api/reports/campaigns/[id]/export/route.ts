import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getCampaignReport } from "@/modules/reporting/service";

const csv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !session.user.roles.some((role) => role === Role.ADMIN || role === Role.LECTURER)) return new Response("Không có quyền truy cập.", { status: 403 });
  try {
    const lecturer = session.user.roles.includes(Role.ADMIN) ? undefined : await db.lecturerProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
    const report = await getCampaignReport(db, (await params).id, lecturer?.id);
    const rows: unknown[][] = [["Khảo sát", report.title], ["Học phần", report.course], ["Tỷ lệ tham gia", `${report.participationRate}%`], [], ["Câu hỏi", "Kết quả"]];
    for (const question of report.questions) rows.push([question.content, question.average !== undefined ? `${question.average}/${question.scaleMax} (thang ${question.scaleMin}–${question.scaleMax})` : question.distribution?.map((item) => `${item.label}: ${item.count}`).join("; ") ?? question.comments?.join(" | ")]);
    return new Response("\ufeff" + rows.map((row) => row.map(csv).join(",")).join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="report-${report.id}.csv"` } });
  } catch (error) { return new Response(error instanceof Error ? error.message : "Không thể xuất báo cáo.", { status: 400 }); }
}
