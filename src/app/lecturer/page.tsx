import Link from "next/link";
import {ReportViewer} from "@/components/ReportViewer";
import {CampaignFilters,type ReportParams} from "@/components/CampaignFilters";
import {matchesReportFilters,campaignReportHref} from "@/modules/reporting/presentation";
import {campaignPhase,campaignPhaseLabels} from "@/modules/survey-campaign/rules";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { getCampaignReport } from "@/modules/reporting/service";

export default async function LecturerPage({ searchParams }: { searchParams: Promise<ReportParams> }) {
  const user = await requireUser(Role.LECTURER);
  if (user.roles.includes("DEAN")) { const { redirect } = await import("next/navigation"); redirect("/dean"); }
  const lecturer = await db.lecturerProfile.findUniqueOrThrow({ where: { userId: user.id } });
  const related = await db.surveyCampaign.findMany({ where: { status:{in:["PUBLISHED","CLOSED"]}, OR: [{participations:{some:{teachings:{some:{lecturerId:lecturer.id}}}}},{ courseTargets: { some: { course: { lecturers: { some: { id: lecturer.id } } } } } }, { targets: { some: { class: { lecturerId: lecturer.id } } } }, { courseTargets: { some: { course: { classes: { some: { lecturerId: lecturer.id } } } } } }] }, include: {participations:{select:{teachings:{select:{lecturerId:true}}}}, faculty: true, semester:true, courseTargets: { include: { course: { include: { lecturers: { select: { id: true } }, classes: { select: { lecturerId: true, semesterId: true } } } } } }, targets: { include: { class: { include: { course: true } } } }, _count: { select: { submissions: true } } }, orderBy: { createdAt: "desc" } });
  const campaigns = related.filter(c => c.evaluationMode==="LECTURER"?c.participations.some(p=>p.teachings.some(t=>t.lecturerId===lecturer.id)):c.scope === "LEGACY_CLASS" || c.courseTargets.some(t => t.course.lecturers.some(l => l.id === lecturer.id) || t.course.classes.some(x => x.lecturerId === lecturer.id && x.semesterId === c.semesterId)));
  const params=await searchParams,selected=params.campaign,now=new Date();
  const visible=campaigns.filter(c=>matchesReportFilters(c,params,now));
  const semesters=[...new Map(campaigns.flatMap(c=>c.semester?[[c.semester.id,c.semester] as const]:[])).values()];
  let report: Awaited<ReturnType<typeof getCampaignReport>> | undefined;
  let reportError: string | undefined;
  if (selected) try { report = await getCampaignReport(db, selected, lecturer.id); } catch (error) { reportError = error instanceof Error ? error.message : "Không thể mở báo cáo."; }
  return <AppShell name={user.name} role="Giảng viên" wide><p className="eyebrow">Kết quả trong phạm vi giảng dạy</p><h1>Kết quả khảo sát giảng dạy</h1><p className="lead">Theo dõi các đợt liên quan đến môn và giảng viên được đánh giá. Báo cáo chỉ mở sau khi đợt đóng hoặc hết hạn và đủ ngưỡng phản hồi; không hiển thị danh tính sinh viên.</p>
 <section className="role-stats" aria-label="Tổng quan khảo sát giảng dạy"><article className="card"><span className="muted">Đợt liên quan</span><strong>{campaigns.length}</strong><small>Trong phạm vi giảng dạy của bạn</small></article><article className="card"><span className="muted">Đang tiếp nhận</span><strong>{campaigns.filter(c=>campaignPhase(c,now)==="OPEN").length}</strong><small>Chưa mở kết quả tổng hợp</small></article><article className="card"><span className="muted">Đã kết thúc</span><strong>{campaigns.filter(c=>["CLOSED","EXPIRED"].includes(campaignPhase(c,now))).length}</strong><small>Kết quả còn phụ thuộc ngưỡng phản hồi</small></article></section>
 <CampaignFilters params={params} semesters={semesters} path="/lecturer"/>
 <h2 className="section-title">Các đợt khảo sát</h2><section className="role-campaigns">{visible.map(c=>{const phase=campaignPhase(c,now),ended=["CLOSED","EXPIRED"].includes(phase);return <article className={`card role-campaign${selected===c.id?" is-selected":""}`} key={c.id}><span className={`pill role-phase phase-${phase}`}>{campaignPhaseLabels[phase]}</span><h3><Link href={campaignReportHref(c.id,params)}>{c.title}</Link></h3><p className="muted">{c.faculty?.name??c.targets[0]?.class.course.name??"Khảo sát giảng dạy"} · {c.semester?.name??"Đợt khảo sát cũ"}</p><p>{c.evaluationMode==="LECTURER"?"Đánh giá giảng viên thực dạy":"Đánh giá chất lượng môn học"}</p><p className="muted">Hạn tiếp nhận: {c.endsAt.toLocaleDateString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh"})}</p><Link className="button secondary" href={campaignReportHref(c.id,params)} aria-current={selected===c.id?"true":undefined}>{ended?"Xem kết quả đánh giá":"Xem điều kiện mở kết quả"}</Link></article>;})}</section>
 {!visible.length&&<section className="card role-empty"><h3>{campaigns.length?"Không tìm thấy đợt phù hợp":"Chưa có khảo sát liên quan"}</h3><p className="muted">{campaigns.length?"Thử đổi từ khóa, học kỳ hoặc trạng thái.":"Các đợt khảo sát thuộc phạm vi giảng dạy sẽ xuất hiện sau khi được công bố."}</p></section>}
 {reportError&&<section id="ket-qua" className="card role-section" role="status"><h2>Chưa thể mở kết quả</h2><p>{reportError}</p><p className="muted">Bạn có thể quay lại sau khi đợt kết thúc và số phản hồi đạt yêu cầu.</p></section>}
 {report&&<ReportViewer key={report.id} report={report}/>}
 {!selected&&visible.length>0&&<p className="notice role-section">Chọn một đợt ở trên để xem kết quả hoặc điều kiện mở báo cáo.</p>}
 </AppShell>;
}
