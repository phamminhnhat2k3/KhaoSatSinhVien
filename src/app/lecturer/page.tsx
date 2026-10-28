import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { getCampaignReport } from "@/modules/reporting/service";

export default async function LecturerPage({ searchParams }: { searchParams: Promise<{ campaign?: string }> }) {
  const user = await requireUser(Role.LECTURER);
  const lecturer = await db.lecturerProfile.findUniqueOrThrow({ where: { userId: user.id } });
  const related = await db.surveyCampaign.findMany({ where: { OR: [{ targets: { some: { class: { lecturerId: lecturer.id } } } }, { courseTargets: { some: { course: { classes: { some: { lecturerId: lecturer.id } } } } } }] }, include: { faculty: true, courseTargets: { include: { course: { include: { classes: { select: { lecturerId: true, semesterId: true } } } } } }, targets: { include: { class: { include: { course: true } } } }, _count: { select: { submissions: true } } }, orderBy: { createdAt: "desc" } });
  const campaigns = related.filter(c => c.scope === "LEGACY_CLASS" || c.courseTargets.some(t => t.course.classes.some(x => x.lecturerId === lecturer.id && x.semesterId === c.semesterId)));
  const selected = (await searchParams).campaign;
  let report: Awaited<ReturnType<typeof getCampaignReport>> | undefined;
  let reportError: string | undefined;
  if (selected) try { report = await getCampaignReport(db, selected, lecturer.id); } catch (error) { reportError = error instanceof Error ? error.message : "Không thể mở báo cáo."; }
  return <AppShell name={user.name} role="Giảng viên"><p className="eyebrow">Chất lượng học phần</p><h1>Nhìn vào xu hướng, không nhìn vào danh tính.</h1><p className="lead">Báo cáo chỉ xuất hiện sau khi đợt khảo sát đóng. Mỗi môn được kiểm tra ngưỡng ẩn danh riêng; môn chưa đủ phản hồi không hiển thị kết quả.</p>
    <section className="grid">{campaigns.map((campaign) => <a className="card" key={campaign.id} href={`?campaign=${campaign.id}`}><span className="pill">{campaign.status}</span><h3>{campaign.title}</h3><p className="muted">{campaign.faculty?.name ?? campaign.targets[0]?.class.course.name} · {campaign._count.submissions} phiếu toàn đợt</p></a>)}</section>
    {reportError && <p className="notice" style={{marginTop: "2rem"}}>{reportError}</p>}
    {report && <section style={{marginTop: "2rem"}}><div className="actions" style={{justifyContent: "space-between"}}><div><p className="eyebrow">Báo cáo tổng hợp</p><h2>{report.title}</h2></div><a className="button secondary" href={`/api/reports/campaigns/${report.id}/export`}>Xuất CSV</a></div><div className="grid"><article className="card"><span className="muted">Tỷ lệ tham gia</span><div className="stat">{report.participationRate}%</div><span className="muted">{report.completed}/{report.invited} sinh viên</span></article><article className="card"><span className="muted">Phản hồi ẩn danh</span><div className="stat">{report.responses}</div></article></div><div className="stack" style={{marginTop: "1rem"}}>{report.questions.map((question) => <article className="card" key={question.id}><h3>{question.content}</h3><p className="muted">{question.respondents}/{question.invited} sinh viên được giao phần đánh giá này đã gửi phiếu.</p>{question.average !== undefined && <div className="stat">{question.average}<small className="muted" style={{fontSize: "1rem"}}>/{question.scaleMax} · Thang {question.scaleMin}–{question.scaleMax}</small></div>}{question.distribution && <div className="stack">{question.distribution.map((item) => <div key={item.label} className="actions" style={{justifyContent: "space-between"}}><span>{item.label}</span><strong>{item.count}</strong></div>)}</div>}{question.comments?.map((comment, index) => <blockquote className="notice" key={index}>“{comment}”</blockquote>)}</article>)}</div></section>}
  </AppShell>;
}
