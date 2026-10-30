import Link from "next/link";
import {campaignPhase,campaignPhaseLabels} from "@/modules/survey-campaign/rules";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";

export default async function StudentPage({ searchParams }: { searchParams: Promise<{ submitted?: string; semesterId?: string }> }) {
  const user = await requireUser(Role.STUDENT);
  const params = await searchParams;
  const student = await db.studentProfile.findUniqueOrThrow({ where: { userId: user.id }, include: { academicClass: { include: { faculty: true } } } });
  const [participations, semesters] = await Promise.all([
    db.surveyParticipation.findMany({ where: { studentId: student.id, ...(params.semesterId ? { campaign: { semesterId: params.semesterId } } : {}) }, include: { _count: { select: { courses: true } }, campaign: { include: { faculty: true, semester: true } } }, orderBy: { campaign: { endsAt: "asc" } } }),
    db.semester.findMany({ orderBy: { startsAt: "desc" } })
  ]);
  const now = new Date();
  const pending = participations.filter(p => p.status !== "COMPLETED" && p.campaign.status === "PUBLISHED" && p.campaign.endsAt >= now);
  const completed = participations.filter(p => p.status === "COMPLETED");
  return <AppShell name={user.name} role="Sinh viên"><p className="eyebrow">{student.academicClass ? `${student.academicClass.faculty.name} · ${student.academicClass.code}` : "Không gian của bạn"}</p><h1>Ý kiến của bạn tạo nên thay đổi.</h1><p className="lead">Phiếu toàn trường có nội dung chung. Phiếu theo khoa có thể thêm phần môn học phù hợp với đăng ký của bạn.</p>{params.submitted && <p className="notice">Cảm ơn bạn! Phản hồi đã được ghi nhận ẩn danh.</p>}<form method="get" className="actions"><label className="field">Học kỳ<select className="input" name="semesterId" defaultValue={params.semesterId ?? ""}><option value="">Tất cả học kỳ</option>{semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><button className="button secondary">Lọc học kỳ</button></form><section className="grid"><article className="card"><span className="muted">Cần hoàn thành</span><div className="stat">{pending.length}</div></article><article className="card"><span className="muted">Đã hoàn thành</span><div className="stat">{completed.length}</div></article></section><h2 className="section-title">Khảo sát được giao</h2><section className="grid">{pending.length ? pending.map(p => <article className="card" key={p.id}><span className="pill">{campaignPhase(p.campaign,now)==="SCHEDULED"?campaignPhaseLabels.SCHEDULED:p.status === "DRAFT" ? "Đang làm" : "Mới"}</span><h3>{p.campaign.title}</h3><p className="muted">{p.campaign.scope === "UNIVERSITY" ? "Toàn trường" : p.campaign.faculty?.name ?? "Khảo sát đã giao"}<br/>{p.campaign.semester?.name} · {p._count.courses ? `Phần chung + ${p._count.courses} môn của bạn` : "Nội dung chung"}<br/>Hạn: {p.campaign.endsAt.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</p>{campaignPhase(p.campaign,now)==="SCHEDULED"?<p className="notice">Bắt đầu: {p.campaign.startsAt.toLocaleDateString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh"})}</p>:<Link className="button" href={`/student/surveys/${p.campaignId}`}>Thực hiện khảo sát</Link>}</article>) : <article className="card"><h3>Không có khảo sát cần làm</h3><p className="muted">Các đợt phù hợp sẽ xuất hiện khi được công bố.</p></article>}</section><h2 className="section-title">Đã hoàn thành</h2><div className="stack">{completed.map(p => <article className="card" key={p.id}><span className="pill">Đã gửi</span><h3>{p.campaign.title}</h3><p className="muted">{p.campaign.semester?.name} · {p.completedAt?.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</p></article>)}</div></AppShell>;
}
