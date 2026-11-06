import Link from "next/link";
import { campaignPhase, campaignPhaseLabels } from "@/modules/survey-campaign/rules";
import { studentWorklist, studentFilterHref } from "@/modules/survey-campaign/student-worklist";
import { educationSystem } from "@/modules/academic/education";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import styles from "@/components/RoleWorkspace.module.css";

export default async function StudentPage({ searchParams }: { searchParams: Promise<{ submitted?: string; semesterId?: string; q?: string; view?: string }> }) {
  const user = await requireUser(Role.STUDENT), params = await searchParams;
  const student = await db.studentProfile.findUniqueOrThrow({ where: { userId: user.id }, include: { academicClass: { include: { faculty: true } } } });
  const [participations, semesters] = await Promise.all([
    db.surveyParticipation.findMany({ where: { studentId: student.id, ...(params.semesterId ? { campaign: { semesterId: params.semesterId } } : {}) }, include: { teachings: { include: { course: true, lecturer: { select: { user: { select: { name: true } } } } } }, courses: { include: { course: true } }, _count: { select: { courses: true, teachings: true } }, campaign: { include: { faculty: true, semester: true } } }, orderBy: { campaign: { endsAt: "asc" } } }),
    db.semester.findMany({ orderBy: { startsAt: "desc" } })
  ]);
  const now = new Date(), q = (params.q ?? "").trim().slice(0, 100);
  const view = ["all", "open", "draft", "scheduled", "completed", "ended"].includes(params.view ?? "") ? params.view! : "all";
  const work = studentWorklist(participations, now);
  const matches = (p: typeof participations[number]) => p.campaign.title.toLocaleLowerCase("vi").includes(q.toLocaleLowerCase("vi")) && (view === "all" || view === "completed" && p.status === "COMPLETED" || view === "ended" && work.ended.includes(p) || view === "draft" && work.drafts.includes(p) || view === "open" && work.open.includes(p) || view === "scheduled" && work.scheduled.includes(p));
  const open = work.open.filter(matches), scheduled = work.scheduled.filter(matches), completed = work.completed.filter(matches), ended = work.ended.filter(matches);
  const next = open[0], total = work.open.length + work.scheduled.length + work.completed.length + work.ended.length;
  const date = (value: Date) => value.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  function cards(items: typeof participations) {
    return <div className={styles.cards}>{items.map(p => {
      const phase = campaignPhase(p.campaign, now), done = p.status === "COMPLETED", canStart = !done && phase === "OPEN";
      return <article className={`card role-campaign ${styles.card}`} key={p.id}>
        <span className={`pill role-phase phase-${done ? "COMPLETED" : phase}`}>{done ? "Đã gửi" : phase === "OPEN" ? p.status === "DRAFT" ? "Đang làm" : "Đang tiếp nhận" : campaignPhaseLabels[phase]}</span>
        <h3>{p.campaign.title}</h3>
        <p className={`muted ${styles.meta}`}>{p.campaign.scope === "UNIVERSITY" ? "Toàn trường" : p.campaign.faculty?.name ?? "Khảo sát được giao"} · {p.campaign.semester?.name}</p>
        <span className={`evaluation-kind ${p.campaign.evaluationMode === "LECTURER" && p._count.teachings ? "is-personal" : ""}`}>{p.campaign.evaluationMode === "LECTURER" && p._count.teachings ? `Đánh giá giảng viên dạy môn học · ${p._count.teachings} phần` : p._count.courses ? `Đánh giá chất lượng môn học · ${p._count.courses} môn` : "Khảo sát chung"}</span>
        {(p._count.teachings > 0 || p._count.courses > 0) && <details className="survey-assignment-preview"><summary>Xem đối tượng được đánh giá</summary><ul>{p.campaign.evaluationMode === "LECTURER" ? [...p.teachings].sort((a, b) => a.course.code.localeCompare(b.course.code, "vi") || a.lecturer.user.name.localeCompare(b.lecturer.user.name, "vi")).map(t => <li key={`${t.courseId}:${t.lecturerId}`}><strong>{t.course.code} · {t.course.name}</strong><span>{t.lecturer.user.name}</span></li>) : [...p.courses].sort((a, b) => a.course.code.localeCompare(b.course.code, "vi")).map(t => <li key={t.courseId}>{t.course.code} · {t.course.name}</li>)}</ul><small className="muted">Theo phân công đã chốt khi công bố đợt.</small></details>}
        <p className={`muted ${styles.meta}`}>{done ? `Đã gửi: ${p.completedAt ? date(p.completedAt) : "Đã ghi nhận"}` : phase === "SCHEDULED" ? `Bắt đầu: ${date(p.campaign.startsAt)}` : `Hạn gửi: ${date(p.campaign.endsAt)}`}</p>
        {canStart && <Link className="button" href={`/student/surveys/${p.campaignId}`}>{p.status === "DRAFT" ? "Tiếp tục khảo sát" : "Thực hiện khảo sát"}</Link>}
        {done && <small className="muted">Bài đã gửi không thể chỉnh sửa.</small>}
      </article>;
    })}</div>;
  }
  return <AppShell name={user.name} role="Sinh viên" wide compact>
    <header className={styles.header}><div><p className="eyebrow">{student.academicClass ? `${student.academicClass.faculty.name} · ${student.academicClass.code} · ${educationSystem(student.academicClass.educationSystem).name}` : "Không gian sinh viên"}</p><h1>Khảo sát của tôi</h1><p className="muted">Hoàn thành phiếu được giao và theo dõi lịch sử. Phản hồi được lưu ẩn danh.</p></div></header>
    {params.submitted && <p className="notice" role="status">Cảm ơn bạn! Phản hồi đã được ghi nhận ẩn danh.</p>}
    <section className={styles.stats} aria-label="Tiến độ khảo sát theo học kỳ"><article className={styles.stat}><span>Đang nhận phản hồi</span><strong>{work.open.length}</strong></article><article className={styles.stat}><span>Đang làm dở</span><strong>{work.drafts.length}</strong></article><article className={styles.stat}><span>Đã hoàn thành<small>{total?Math.round(work.completed.length/total*100):0}% phiếu được giao</small></span><strong>{work.completed.length}</strong></article></section>
    {next && <section className={styles.focus} aria-label="Khảo sát ưu tiên"><div><p className="eyebrow">{next.status === "DRAFT" ? "Tiếp tục phần đang làm" : "Phiếu gần hạn nhất"}</p><strong>{next.campaign.title}</strong><small>Hạn gửi {date(next.campaign.endsAt)} · Bài đã gửi không thể chỉnh sửa</small></div><Link className="button" href={`/student/surveys/${next.campaignId}`}>{next.status === "DRAFT" ? "Mở bản nháp" : "Bắt đầu phiếu này"}</Link></section>}
    {total>0&&!work.open.length&&view==="all"&&!q&&<p className="notice">Hiện không có phiếu đang mở cần hoàn thành.{work.scheduled.length>0?` Có ${work.scheduled.length} phiếu chờ bắt đầu bên dưới.`:" Bạn có thể xem lại trạng thái trong lịch sử."}</p>}
    <details className={styles.fold} open={!!q||!!params.semesterId||view!=="all"}><summary>Bộ lọc khảo sát</summary>
    <form method="get" className={`card role-filters ${styles.filters}`} aria-label="Lọc khảo sát"><label className="field">Tìm khảo sát<input className="input" name="q" defaultValue={q} maxLength={100} placeholder="Tên đợt khảo sát"/></label><label className="field">Học kỳ<select className="input" name="semesterId" defaultValue={params.semesterId ?? ""}><option value="">Tất cả học kỳ</option>{semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label className="field">Trạng thái<select className="input" name="view" defaultValue={view}><option value="all">Tất cả trạng thái</option><option value="open">Đang tiếp nhận</option><option value="draft">Đang làm dở</option><option value="scheduled">Chờ bắt đầu</option><option value="completed">Đã hoàn thành</option><option value="ended">Đã kết thúc, chưa gửi</option></select></label><div className="actions"><button className="button secondary">Lọc khảo sát</button><Link href="/student" className="text-button">Xóa bộ lọc</Link></div></form></details>
    <nav className={styles.tabs} aria-label="Xem nhanh khảo sát">{[["all", "Tất cả", total], ["open", "Cần làm", work.open.length], ["draft", "Bản nháp", work.drafts.length], ["completed", "Đã gửi", work.completed.length]].map(([value, label, count]) => <Link key={value} href={studentFilterHref({ ...params, q }, String(value))} aria-current={view === value ? "page" : undefined}>{label} ({count})</Link>)}</nav>
    {!open.length && !scheduled.length && !completed.length && !ended.length && <section className={styles.empty}><h2>{total ? "Không có khảo sát phù hợp" : "Chưa có khảo sát được giao"}</h2><p className="muted">{total ? "Thử đổi từ khóa, trạng thái hoặc học kỳ." : "Các phiếu phù hợp sẽ xuất hiện khi đơn vị phụ trách công bố."}</p></section>}
    {open.length > 0 && <section className="role-section"><h2>Khảo sát được giao <span className="muted">({open.length})</span></h2>{cards(open)}</section>}
    {scheduled.length > 0 && <details className={styles.fold} open={view === "scheduled" || !!q}><summary>Chờ bắt đầu ({scheduled.length})</summary>{cards(scheduled)}</details>}
    {(completed.length > 0 || ended.length > 0) && <details className={styles.fold} open={view === "completed" || view === "ended" || !!q}><summary>Lịch sử khảo sát ({completed.length + ended.length})</summary>{completed.length > 0 && <section className="role-section"><h2>Đã hoàn thành <span className="muted">({completed.length})</span></h2>{cards(completed)}</section>}{ended.length > 0 && <section className="role-section"><h2>Đã kết thúc · Chưa hoàn thành <span className="muted">({ended.length})</span></h2>{cards(ended)}</section>}</details>}
  </AppShell>;
}
