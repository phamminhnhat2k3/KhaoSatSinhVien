import Link from "next/link";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { CampaignForm } from "@/components/CampaignForm";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";

export default async function NewCampaignPage() {
  const user = await requireUser(Role.ADMIN);
  const [templates, faculties, semesters, courses] = await Promise.all([db.surveyTemplate.findMany({ include: { _count: { select: { questions: true } } }, orderBy: { createdAt: "desc" } }), db.faculty.findMany({ orderBy: { name: "asc" } }), db.semester.findMany({ orderBy: { startsAt: "desc" } }), db.course.findMany({ include: { classes: { select: { semesterId: true } } }, orderBy: { code: "asc" } })]);
  return <AppShell name={user.name} role="Quản trị viên" wide><Link className="text-button" href="/admin">← Trung tâm điều hành</Link><p className="eyebrow">Tổ chức khảo sát</p><h1>Tạo đợt mới</h1><p className="lead">Khảo sát theo khoa với nội dung phù hợp môn thực học, hoặc khảo sát chung cho toàn trường.</p><section className="card">{semesters.length ? <CampaignForm templates={templates.map(t => ({ id: t.id, label: `${t.title} · ${t._count.questions} câu` }))} faculties={faculties.map(f => ({ id: f.id, label: f.name }))} semesters={semesters.map(s => ({ id: s.id, label: s.name }))} courses={courses.map(c => ({ id: c.id, label: `${c.code} · ${c.name}`, facultyId: c.facultyId, semesterIds: [...new Set(c.classes.map(x => x.semesterId))] }))}/> : <div className="empty-state"><h2>Cần có mẫu và học kỳ</h2><div className="actions"><Link className="button" href="/admin/templates/new">Tạo mẫu</Link><Link className="button secondary" href="/admin/academic">Tạo học kỳ / khoa</Link></div></div>}</section></AppShell>;
}
