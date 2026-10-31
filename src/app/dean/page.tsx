import {campaignPhase,campaignPhaseLabels} from "@/modules/survey-campaign/rules";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/access";
import { AppShell } from "@/components/AppShell";
import { getCampaignReport } from "@/modules/reporting/service";

export default async function DeanPage({ searchParams }: { searchParams: Promise<{ campaign?: string }> }) {
  const user = await requireUser("DEAN");
  const own = await db.lecturerProfile.findUnique({ where: { userId: user.id }, include: { faculty: true } });
  const admin = user.roles.includes("ADMIN");
  if (!admin && !own?.facultyId) return <AppShell name={user.name} role="Trưởng khoa"><h1>Chưa phân khoa</h1><p>Quản trị viên cần gắn khoa cho hồ sơ của bạn.</p></AppShell>;
  const campaigns = await db.surveyCampaign.findMany({ where: { scope: "FACULTY", status: {in:["PUBLISHED","CLOSED"]}, ...(admin ? {} : { facultyId: own!.facultyId! }) }, include: { faculty: true, template: { include: { questions: { include: { options: true } } } }, courseTemplate: { include: { questions: { include: { options: true } } } }, courseTargets: { include: { course: true } } }, orderBy: { createdAt: "desc" } });
  const selected = (await searchParams).campaign;
  let report; let error;
  if (selected) try { report = await getCampaignReport(db, selected, undefined, admin ? undefined : own!.facultyId!); } catch (e) { error = e instanceof Error ? e.message : "Không thể mở báo cáo"; }
  return <AppShell name={user.name} role="Trưởng khoa" wide><p className="eyebrow">Kết quả khảo sát của khoa</p><h1>{own?.faculty?.name ?? "Tất cả khoa"}</h1><h2>Kết quả đánh giá</h2><p>Khảo sát do các đơn vị phụ trách tạo và công bố theo kế hoạch đã được duyệt. Trưởng khoa xem kết quả thuộc khoa mình sau khi đợt đóng hoặc hết hạn và đủ ngưỡng phản hồi.</p><div className="stack">{campaigns.map(c => <section className="card" key={c.id}><h2>{c.title}</h2><p>{c.faculty?.name} · {campaignPhaseLabels[campaignPhase(c)]}</p><p>{c.startsAt.toLocaleDateString("vi-VN")} – {c.endsAt.toLocaleDateString("vi-VN")}</p><p>Môn: {c.courseTargets.map(t => t.course.name).join(", ") || "Phần chung"}</p><details><summary>Nội dung mẫu chung</summary>{c.template.questions.map(q => <p key={q.id}>{q.content} · {q.type === "SCALE" ? `Thang ${q.scaleMin}–${q.scaleMax}` : q.type} {q.options.map(o => o.label).join(" / ")}</p>)}</details>{c.courseTemplate && <details><summary>Nội dung mẫu đánh giá môn</summary>{c.courseTemplate.questions.map(q => <p key={q.id}>{q.content} · {q.type === "SCALE" ? `Thang ${q.scaleMin}–${q.scaleMax}` : q.type} {q.options.map(o => o.label).join(" / ")}</p>)}</details>}<Link href={`?campaign=${c.id}`}>Xem kết quả đánh giá</Link></section>)}</div>{error && <p role="status" className="notice">{error}</p>}{report && <section className="stack"><h2>{report.title}</h2><a href={`/api/reports/campaigns/${report.id}/export`}>Xuất CSV</a>{report.questions.map(q => <article className="card" key={q.id}><h3>{q.content}</h3><p>{q.respondents}/{q.invited} phản hồi</p>{q.average !== undefined && <strong>{q.average}/{q.scaleMax}</strong>}{q.distribution?.map(d => <p key={d.label}>{d.label}: {d.count}</p>)}{q.comments?.map((t, i) => <blockquote key={i}>{t}</blockquote>)}</article>)}</section>}</AppShell>;
}
