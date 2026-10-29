import { actorReport } from "@/modules/reporting/access";

const csv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const report = await actorReport((await params).id);
    const rows: unknown[][] = [["Khảo sát", report.title], ["Phạm vi", report.course], ["Tỷ lệ tham gia", `${report.participationRate}%`], [], ["Câu hỏi", "Kết quả", "Số phiếu có phần đánh giá", "Số sinh viên được giao phần"]];
    for (const question of report.questions) rows.push([question.content, question.average !== undefined ? `${question.average}/${question.scaleMax} (thang ${question.scaleMin}–${question.scaleMax})` : question.distribution?.map((item) => `${item.label}: ${item.count}`).join("; ") ?? question.comments?.join(" | "), question.respondents, question.invited]);
    return new Response("\ufeff" + rows.map((row) => row.map(csv).join(",")).join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="report-${report.id}.csv"` } });
  } catch (error) { return new Response(error instanceof Error ? error.message : "Không thể xuất báo cáo.", { status: 400 }); }
}
