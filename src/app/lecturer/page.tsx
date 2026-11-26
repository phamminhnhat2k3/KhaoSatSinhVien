import styles from "@/components/RoleWorkspace.module.css";
import Link from "next/link";
import {canViewCourseResult} from "@/modules/reporting/teaching-scope";
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
  const related = await db.surveyCampaign.findMany({ where: { status:{in:["PUBLISHED","CLOSED"]}, OR: [{participations:{some:{teachings:{some:{lecturerId:lecturer.id}}}}}, { targets: { some: { class: { lecturerId: lecturer.id } } } }, { courseTargets: { some: { course: { classes: { some: { OR:[{teachings:{some:{lecturerId:lecturer.id}}},{lecturerId:lecturer.id,teachingConfigured:false}] } } } } } }] }, include: {participations:{select:{teachings:{where:{lecturerId:lecturer.id},select:{lecturerId:true,courseId:true,course:{select:{code:true,name:true}}}}}}, faculty: true, semester:true, courseTargets: { include: { course: { include: { classes: { select: { lecturerId: true, semesterId: true,teachingConfigured:true,teachings:{select:{lecturerId:true}} } } } } } }, targets: { include: { class: { include: { course: true } } } }, _count: { select: { submissions: true } } }, orderBy: { createdAt: "desc" } });
  const campaigns = related.filter(c => c.evaluationMode==="LECTURER"?c.participations.some(p=>p.teachings.some(t=>t.lecturerId===lecturer.id)):c.scope === "LEGACY_CLASS" || c.courseTargets.some(t => canViewCourseResult(t.course,lecturer.id,c.semesterId)));
  const params=await searchParams,selected=params.campaign,now=new Date();
  const teachingClasses=await db.courseClass.findMany({where:{...(params.semesterId?{semesterId:params.semesterId}:{}),OR:[{teachings:{some:{lecturerId:lecturer.id}}},{lecturerId:lecturer.id,teachingConfigured:false}]},include:{academicAssignments:{include:{academicClass:{select:{code:true}}}},course:true,semester:true,_count:{select:{enrollments:true}}},orderBy:[{semester:{startsAt:"desc"}},{course:{code:"asc"}},{code:"asc"}]});
  const visible=campaigns.filter(c=>matchesReportFilters(c,params,now));
  const semesters=await db.semester.findMany({where:{OR:[{campaigns:{some:{id:{in:campaigns.map(c=>c.id)}}}},{classes:{some:{OR:[{teachings:{some:{lecturerId:lecturer.id}}},{lecturerId:lecturer.id,teachingConfigured:false}]}}}]},orderBy:{startsAt:"desc"}});
  let report: Awaited<ReturnType<typeof getCampaignReport>> | undefined;
  let reportError: string | undefined;
  if (selected) try { report = await getCampaignReport(db, selected, lecturer.id); } catch (error) { reportError = error instanceof Error ? error.message : "Không thể mở báo cáo."; }
  const filterQuery=new URLSearchParams();
  for(const key of ["q","semesterId","phase"] as const)if(params[key])filterQuery.set(key,params[key]);
  const filterHref=`/lecturer${filterQuery.size?`?${filterQuery}`:""}#danh-sach-dot`;
  return <AppShell name={user.name} role="Giảng viên" wide compact>
    <header className={styles.header}><div><p className="eyebrow">Không gian giảng viên</p><h1>Kết quả khảo sát giảng dạy</h1><p className="muted">Chọn đợt để xem phản hồi về môn bạn phụ trách. Kết quả chỉ mở khi đợt kết thúc và đủ ngưỡng ẩn danh.</p></div></header>
    <section className={styles.stats} aria-label="Tổng quan khảo sát giảng dạy"><article className={styles.stat}><span>Đợt liên quan</span><strong>{campaigns.length}</strong></article><article className={styles.stat}><span>Đang tiếp nhận</span><strong>{campaigns.filter(c=>campaignPhase(c,now)==="OPEN").length}</strong></article><article className={styles.stat}><span>Đã kết thúc</span><strong>{campaigns.filter(c=>["CLOSED","EXPIRED"].includes(campaignPhase(c,now))).length}</strong></article></section>
    <details className={styles.fold} open={!selected}><summary>Bộ lọc đợt khảo sát</summary><CampaignFilters params={params} semesters={semesters} path="/lecturer" className={styles.filters}/></details>
    {(report || reportError) && <div className={styles.reportHeading}><h2>Kết quả đang xem</h2><Link className="text-button" href={filterHref}>Đổi đợt khảo sát</Link></div>}
    {reportError&&<section id="ket-qua" className="card role-section" role="status"><h2>Chưa thể mở kết quả</h2><p>{reportError}</p><p className="muted">Bạn có thể quay lại sau khi đợt kết thúc và số phản hồi đạt yêu cầu.</p></section>}
    {report&&<ReportViewer key={report.id} report={report} compact/>}
    {!selected && visible.length>0 && <p className="notice">Chọn một đợt bên dưới. Có thể lọc theo học kỳ và trạng thái để tìm nhanh kết quả.</p>}
    <details id="danh-sach-dot" className={styles.fold} open={!selected}>
      <summary>Các đợt khảo sát ({visible.length})</summary>
      <section className={`role-campaigns ${styles.cards}`}>{visible.map(c=>{
        const phase=campaignPhase(c,now),ended=["CLOSED","EXPIRED"].includes(phase);
        const subjects=c.evaluationMode==="LECTURER"?[...new Map(c.participations.flatMap(p=>p.teachings).map(t=>[t.courseId,t.course])).values()]:c.courseTargets.filter(t=>canViewCourseResult(t.course,lecturer.id,c.semesterId)).map(t=>t.course);
        return <article className={`card role-campaign ${styles.card}${selected===c.id?" is-selected":""}`} key={c.id}>
          <span className={`pill role-phase phase-${phase}`}>{campaignPhaseLabels[phase]}</span><h3><Link href={campaignReportHref(c.id,params)}>{c.title}</Link></h3>
          <p className={`muted ${styles.meta}`}>{c.faculty?.name??c.targets[0]?.class.course.name??"Khảo sát giảng dạy"} · {c.semester?.name??"Đợt khảo sát cũ"}</p>
          <span className={`evaluation-kind ${c.evaluationMode==="LECTURER"?"is-personal":""}`}>{c.evaluationMode==="LECTURER"?"Đánh giá cá nhân giảng viên":"Kết quả chung của môn học"}</span>
          <details><summary>Môn liên quan ({subjects.length})</summary><ul className="lecturer-campaign-subjects">{subjects.map(course=><li key={course.code}>{course.code} · {course.name}</li>)}</ul></details>
          <p className={`muted ${styles.meta}`}>Hạn tiếp nhận: {c.endsAt.toLocaleDateString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh"})}</p>
          <Link className="button secondary" href={campaignReportHref(c.id,params)} aria-current={selected===c.id?"true":undefined}>{ended?"Xem kết quả đánh giá":"Xem điều kiện mở kết quả"}</Link>
        </article>;
      })}</section>
      {!visible.length&&<section className={styles.empty}><h2>{campaigns.length?"Không tìm thấy đợt phù hợp":"Chưa có khảo sát liên quan"}</h2><p className="muted">{campaigns.length?"Thử đổi từ khóa, học kỳ hoặc trạng thái.":"Các đợt thuộc phạm vi giảng dạy sẽ xuất hiện sau khi được công bố."}</p></section>}
    </details>
    <details className={`card teaching-overview ${styles.fold}`}><summary>Phân công giảng dạy · {teachingClasses.length} lớp học phần</summary><p className="muted">Phân công hiện tại{params.semesterId?" trong học kỳ đang lọc":" theo học kỳ"}. Phiếu đã công bố vẫn giữ môn và người dạy được chốt ở thời điểm công bố.</p>{teachingClasses.length?<div className="teaching-class-list">{teachingClasses.map(c=><article key={c.id}><strong>{c.course.code} · {c.course.name}</strong><span>{c.code} · {c.semester.name}</span><small>{c.academicAssignments.length?`Lớp hành chính: ${c.academicAssignments.map(a=>a.academicClass.code).join(", ")} · `:""}{c._count.enrollments} đăng ký riêng</small></article>)}</div>:<p className="muted">Chưa có lớp được phân công trong học kỳ này.</p>}</details>
    <details className={`${styles.fold} ${styles.help}`}><summary>Cách đọc kết quả</summary><p><strong>Đánh giá giảng viên:</strong> phản hồi về chính bạn trong từng môn theo phân công đã chốt.</p><p><strong>Đánh giá môn học:</strong> kết quả chung của môn, không quy thành điểm cá nhân. Các phần hoặc câu chưa đủ phản hồi vẫn được ẩn.</p><p>CSV xuất toàn bộ kết quả được phép xem, kể cả khi màn hình chỉ đang chọn một môn.</p></details>
  </AppShell>;
}
