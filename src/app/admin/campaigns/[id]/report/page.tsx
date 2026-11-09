import Link from "next/link";
import { ReminderForm } from "@/components/ReminderForm";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { CampaignProgress } from "@/components/CampaignProgress";
import { ReportViewer } from "@/components/ReportViewer";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { getCampaignReport } from "@/modules/reporting/service";
import { progressGroups } from "@/modules/reporting/progress";
import { campaignPhase, campaignPhaseLabels } from "@/modules/survey-campaign/rules";

export default async function AdminReportPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ course?: string }> }) {
  const user = await requireUser("ADMIN"), { id } = await params, { course } = await searchParams;
  const campaign = await db.surveyCampaign.findUnique({ where: { id }, include: { faculty: true, semester: true, participations: { select: { status: true, student: { select: { academicClass: { select: { id: true, code: true, faculty: { select: { name: true } } } } } } } } } });
  if (!campaign) notFound();
  const completed = campaign.participations.filter(p => p.status === "COMPLETED").length;
  const drafts = campaign.participations.filter(p => p.status === "DRAFT").length;
  let report: Awaited<ReturnType<typeof getCampaignReport>> | undefined, error: string | undefined;
  try { report = await getCampaignReport(db, id); } catch (e) { error = e instanceof Error ? e.message : "Chưa thể mở báo cáo."; }
  const date = (d: Date) => d.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  return <AppShell name={user.name} role="Quản trị viên" wide>
    <Link className="text-button" href="/admin">← Quản lý khảo sát</Link><p className="eyebrow">Tiến độ và kết quả</p><h1>{campaign.title}</h1>
    <p className="lead">{campaign.faculty?.name ?? "Toàn trường"} · {campaign.semester?.name ?? "Đợt khảo sát cũ"}</p>
    <div className="section-heading"><span className="pill">{campaignPhaseLabels[campaignPhase(campaign)]}</span><span className="muted">{date(campaign.startsAt)} – {date(campaign.endsAt)}</span></div>
    <nav className="actions section-title" aria-label="Nội dung báo cáo"><a className="button secondary" href="#tien-do">Tiến độ tham gia</a><a className="button secondary" href="#ket-qua">Kết quả đánh giá</a><Link className="button secondary" href={`/admin/campaigns/${id}/responses`}>Xem các phiếu ẩn danh</Link></nav>
    <div id="tien-do"><CampaignProgress invited={campaign.participations.length} completed={completed} drafts={drafts} groups={progressGroups(campaign.participations)}/></div>
    <p className="muted">Tải lại trang để lấy tiến độ mới nhất. Biểu đồ theo dõi người được giao phiếu, không phải số câu trả lời.</p>
    {campaignPhase(campaign) === "OPEN" && <ReminderForm id={id} count={campaign.participations.length-completed}/>}
    {error && <section id="ket-qua" className="card section-title"><h2>Kết quả đánh giá</h2><p className="notice" role="status">{error}</p><p className="muted">Bạn vẫn theo dõi được tiến độ ở trên. Điểm và góp ý chỉ hiển thị khi đủ điều kiện bảo vệ tính ẩn danh.</p></section>}
    {report && <ReportViewer report={report} initialSection={course}/>}
  </AppShell>;
}
