import Link from "next/link";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { CampaignForm } from "@/components/CampaignForm";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";

export default async function NewCampaignPage() {
  const user = await requireUser(Role.ADMIN);
  const [templates, classes] = await Promise.all([db.surveyTemplate.findMany({ include: { _count: { select: { questions: true } } }, orderBy: { createdAt: "desc" } }), db.courseClass.findMany({ include: { course: true, semester: true, _count: { select: { enrollments: true } } }, orderBy: { code: "asc" } })]);
  return <AppShell name={user.name} role="Quản trị viên" wide><Link className="text-button" href="/admin">← Trung tâm điều hành</Link><p className="eyebrow">Tổ chức khảo sát</p><h1>Tạo đợt mới</h1><p className="lead">Chọn đúng nội dung, đúng đối tượng và thời gian. Đợt mới được lưu nháp để bạn kiểm tra trước khi công bố.</p><section className="card">{templates.length && classes.length ? <CampaignForm templates={templates.map(t => ({ id: t.id, label: `${t.title} · ${t._count.questions} câu` }))} classes={classes.map(c => ({ id: c.id, label: `${c.code} · ${c.course.name} · ${c.semester.name} (${c._count.enrollments} SV)` }))}/> : <div className="empty-state"><h2>Cần chuẩn bị nội dung và lớp học</h2><p>Tạo ít nhất một mẫu và một lớp trước khi lập đợt khảo sát.</p><div className="actions"><Link className="button" href="/admin/templates/new">Tạo mẫu</Link><Link className="button secondary" href="/admin/classes/new">Tạo lớp</Link></div></div>}</section></AppShell>;
}
