import Link from "next/link";
import {notFound} from "next/navigation";
import {AppShell} from "@/components/AppShell";
import {requireUser} from "@/lib/access";
import {db} from "@/lib/db";
import {getCampaignReport} from "@/modules/reporting/service";
import {participationRate} from "@/modules/reporting/report";

export default async function AdminReportPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{course?:string}>}) {
  const user=await requireUser("ADMIN");const {id}=await params;const {course}=await searchParams;
  const campaign=await db.surveyCampaign.findUnique({where:{id},include:{faculty:true,semester:true,_count:{select:{participations:true,submissions:true}}}});
  if(!campaign)notFound();
  const completed=await db.surveyParticipation.count({where:{campaignId:id,status:"COMPLETED"}});
  let report:Awaited<ReturnType<typeof getCampaignReport>>|undefined,error:string|undefined;
  try{report=await getCampaignReport(db,id);}catch(e){error=e instanceof Error?e.message:"Chưa thể mở báo cáo.";}
  const sections=[...new Map(report?.questions.map(q=>[q.courseId??"common",q.sectionTitle])??[]).entries()];
  const questions=report?.questions.filter(q=>!course||(q.courseId??"common")===course)??[];
  return <AppShell name={user.name} role="Quản trị viên" wide>
    <Link className="text-button" href="/admin">← Quản lý khảo sát</Link><p className="eyebrow">Tiến độ và kết quả</p><h1>{campaign.title}</h1>
    <p className="lead">{campaign.faculty?.name??"Toàn trường"} · {campaign.semester?.name??"Đợt khảo sát cũ"}</p>
    <section className="grid" aria-label="Tiến độ khảo sát">
      <article className="card"><span className="muted">Được giao phiếu</span><div className="stat">{campaign._count.participations}</div></article>
      <article className="card"><span className="muted">Đã hoàn thành</span><div className="stat">{completed}</div></article>
      <article className="card"><span className="muted">Chưa hoàn thành</span><div className="stat">{Math.max(0,campaign._count.participations-completed)}</div></article>
      <article className="card"><span className="muted">Tỷ lệ hoàn thành</span><div className="stat">{participationRate(completed,campaign._count.participations)}%</div></article>
    </section>
    <div className="actions section-title"><Link className="button secondary" href={`/admin/campaigns/${id}/responses`}>Xem từng phiếu đã gửi</Link>{report&&<a className="button" href={`/api/reports/campaigns/${id}/export`}>Xuất báo cáo CSV</a>}</div>
    {error&&<p className="notice" role="status">{error} Tiến độ vẫn được cập nhật ở trên.</p>}
    {report&&<><h2 className="section-title">Kết quả tổng hợp</h2><p className="muted">Số người trả lời được tính riêng từng câu; câu bỏ trống không được tính. Kết quả chưa đủ ngưỡng ẩn danh được ẩn.</p>
      <form className="actions" method="get"><label className="field">Lọc phần đánh giá<select className="input" name="course" defaultValue={course??""}><option value="">Tất cả phần</option>{sections.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><button className="button secondary">Lọc kết quả</button></form>
      <div className="stack section-title">{questions.map(q=><article className="card stack" key={q.id}><span className="pill">{q.sectionTitle}</span><h3>{q.content}</h3><p className="muted">{q.respondents} người trả lời câu này · {q.invited} người được giao</p>
        {q.suppressed?<p className="notice">Chưa đủ số câu trả lời để hiển thị kết quả an toàn.</p>:<>{q.average!==undefined&&<div><span className="muted">Điểm trung bình</span><div className="stat">{q.average}<small> / {q.scaleMax}</small></div><p className="muted">Thang {q.scaleMin}–{q.scaleMax}</p></div>}
        {q.distribution?.map(d=><div key={d.label}><div className="section-heading"><span>{d.label}</span><strong>{d.count} ({q.respondents?Math.round(d.count/q.respondents*100):0}%)</strong></div><meter className="report-meter" min="0" max={Math.max(1,q.respondents)} value={d.count} aria-label={d.label}/></div>)}
        {q.comments?.map((comment,index)=><blockquote className="notice" key={index}>{comment}</blockquote>)}</>}
      </article>)}{!questions.length&&<p className="notice">Chưa có kết quả đủ điều kiện trong phần đã chọn.</p>}</div>
    </>}
  </AppShell>;
}
