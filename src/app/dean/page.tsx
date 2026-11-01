import {ReportViewer} from "@/components/ReportViewer";
import {CampaignFilters,type ReportParams} from "@/components/CampaignFilters";
import {matchesReportFilters,campaignReportHref} from "@/modules/reporting/presentation";
import {campaignPhase,campaignPhaseLabels} from "@/modules/survey-campaign/rules";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/access";
import { AppShell } from "@/components/AppShell";
import { getCampaignReport } from "@/modules/reporting/service";

export default async function DeanPage({ searchParams }: { searchParams: Promise<ReportParams> }) {
  const user = await requireUser("DEAN");
  const own = await db.lecturerProfile.findUnique({ where: { userId: user.id }, include: { faculty: true } });
  const admin = user.roles.includes("ADMIN");
  if (!admin && !own?.facultyId) return <AppShell name={user.name} role="Trưởng khoa"><h1>Chưa phân khoa</h1><p>Quản trị viên cần gắn khoa cho hồ sơ của bạn.</p></AppShell>;
  const campaigns = await db.surveyCampaign.findMany({ where: { scope: "FACULTY", status: {in:["PUBLISHED","CLOSED"]}, ...(admin ? {} : { facultyId: own!.facultyId! }) }, include: { faculty: true, semester:true, courseTargets: { include: { course: true } } }, orderBy: { createdAt: "desc" } });
  const params=await searchParams,selected=params.campaign,now=new Date();
  const visible=campaigns.filter(c=>matchesReportFilters(c,params,now));
  const semesters=[...new Map(campaigns.flatMap(c=>c.semester?[[c.semester.id,c.semester] as const]:[])).values()];
  let report; let error;
  if (selected) try { report = await getCampaignReport(db, selected, undefined, admin ? undefined : own!.facultyId!); } catch (e) { error = e instanceof Error ? e.message : "Không thể mở báo cáo"; }
  return <AppShell name={user.name} role="Trưởng khoa" wide><p className="eyebrow">Kết quả khảo sát của khoa</p><h1>{own?.faculty?.name??"Tất cả khoa"}</h1><p className="lead">Xem kết quả trong khoa và theo dõi các đợt đã công bố. Khảo sát do đơn vị phụ trách tổ chức theo kế hoạch đã được duyệt; Trưởng khoa không thực hiện xét duyệt trên hệ thống.</p>
 <section className="role-stats" aria-label="Tổng quan khảo sát của khoa"><article className="card"><span className="muted">Đợt đã công bố</span><strong>{campaigns.length}</strong><small>Chỉ trong phạm vi khoa được phân công</small></article><article className="card"><span className="muted">Đang tiếp nhận</span><strong>{campaigns.filter(c=>campaignPhase(c,now)==="OPEN").length}</strong><small>Chưa mở kết quả tổng hợp</small></article><article className="card"><span className="muted">Đã kết thúc</span><strong>{campaigns.filter(c=>["CLOSED","EXPIRED"].includes(campaignPhase(c,now))).length}</strong><small>Chỉ xem khi đủ ngưỡng phản hồi</small></article></section>
 <CampaignFilters params={params} semesters={semesters} path="/dean"/>
 <h2 className="section-title">Kết quả đánh giá</h2><div className="role-campaigns">{visible.map(c=>{const phase=campaignPhase(c,now),ended=["CLOSED","EXPIRED"].includes(phase);return <section className={`card role-campaign${selected===c.id?" is-selected":""}`} key={c.id}><span className={`pill role-phase phase-${phase}`}>{campaignPhaseLabels[phase]}</span><h2><Link href={campaignReportHref(c.id,params)}>{c.title}</Link></h2><p className="muted">{c.semester?.name??"Đợt khảo sát cũ"} · {c.faculty?.name}</p><p>{c.courseTargets.length?`${c.evaluationMode==="LECTURER"?"Đánh giá giảng viên":"Đánh giá môn học"} · ${c.courseTargets.map(t=>t.course.name).join(", ")}`:"Khảo sát chung của khoa"}</p><p className="muted">{c.startsAt.toLocaleDateString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh"})} – {c.endsAt.toLocaleDateString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh"})}</p><Link className="button secondary" href={campaignReportHref(c.id,params)} aria-current={selected===c.id?"true":undefined}>{ended?"Xem kết quả đánh giá":"Xem điều kiện mở kết quả"}</Link></section>;})}</div>
 {!visible.length&&<section className="card role-empty"><h3>{campaigns.length?"Không tìm thấy đợt phù hợp":"Chưa có khảo sát được công bố trong khoa"}</h3><p className="muted">{campaigns.length?"Thử đổi từ khóa, học kỳ hoặc trạng thái.":"Các đợt thuộc khoa sẽ xuất hiện tại đây sau khi được công bố."}</p></section>}
 {error&&<section id="ket-qua" className="card role-section" role="status"><h2>Chưa thể mở kết quả</h2><p>{error}</p><p className="muted">Báo cáo chỉ mở sau khi đợt đóng hoặc hết hạn và đủ ngưỡng phản hồi.</p></section>}
 {report&&<ReportViewer key={report.id} report={report}/>}
 {!selected&&visible.length>0&&<p className="notice role-section">Chọn một đợt để xem báo cáo. Bạn chỉ xem được kết quả thuộc khoa mình.</p>}
 </AppShell>;
}
