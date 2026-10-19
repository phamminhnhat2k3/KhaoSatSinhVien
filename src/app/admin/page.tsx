import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { CampaignForm } from "@/components/CampaignForm";
import { TemplateForm } from "@/components/TemplateForm";
import { CourseClassForm, StudentForm } from "@/components/AcademicForms";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { closeCampaign, publishCampaign } from "./actions";

export default async function AdminPage() {
  const user = await requireUser(Role.ADMIN);
  const [campaigns, classes, users, templates, semesters, lecturers] = await Promise.all([
    db.surveyCampaign.findMany({ include: { _count: { select: { participations: true, submissions: true } }, targets: { include: { class: { include: { course: true } } } } }, orderBy: { createdAt: "desc" } }),
    db.courseClass.findMany({ include: { course: true, semester: true }, orderBy: { code: "asc" } }),
    db.user.count(), db.surveyTemplate.count(), db.semester.findMany({ orderBy: { startsAt: "desc" } }), db.lecturerProfile.findMany({ include: { user: true }, orderBy: { lecturerCode: "asc" } })
  ]);
  return <AppShell name={user.name} role="Quản trị viên">
    <p className="eyebrow">Trung tâm điều hành</p><h1>Mỗi phản hồi là một tín hiệu để cải tiến.</h1><p className="lead">Tạo đợt khảo sát, công bố đúng đối tượng và theo dõi tiến độ mà không xem danh tính người trả lời.</p>
    <section className="grid"><article className="card"><span className="muted">Người dùng</span><div className="stat">{users}</div></article><article className="card"><span className="muted">Mẫu khảo sát</span><div className="stat">{templates}</div></article><article className="card"><span className="muted">Đợt đang mở</span><div className="stat">{campaigns.filter((c) => c.status === "PUBLISHED").length}</div></article></section>
    <section className="grid"><article className="card"><h2>Tạo mẫu khảo sát</h2><p className="muted">Mẫu mới có đủ thang điểm, một lựa chọn, nhiều lựa chọn và tự luận.</p><TemplateForm /></article>
      <article className="card"><h2>Tạo đợt mới</h2><p className="muted">Dùng mẫu khảo sát mới nhất với đủ bốn loại câu hỏi.</p><CampaignForm classes={classes.map((item) => ({ id: item.id, label: `${item.code} · ${item.course.name} · ${item.semester.name}` }))} /></article>
    </section><h2 style={{marginTop: "2rem"}}>Dữ liệu học vụ</h2><section className="grid"><article className="card"><h3>Tạo học phần và lớp</h3><CourseClassForm semesters={semesters.map((item) => ({ id: item.id, label: item.name }))} lecturers={lecturers.map((item) => ({ id: item.id, label: `${item.lecturerCode} · ${item.user.name}` }))}/></article><article className="card"><h3>Tạo và ghi danh sinh viên</h3><StudentForm classes={classes.map((item) => ({ id: item.id, label: `${item.code} · ${item.course.name}` }))}/></article></section><article className="card" style={{marginTop: "1rem"}}><h2>Các đợt khảo sát</h2>{campaigns.length === 0 ? <p className="muted">Chưa có đợt khảo sát.</p> : <div className="stack">{campaigns.map((campaign) => <div className="question" key={campaign.id}><div className="actions" style={{justifyContent: "space-between"}}><div><strong>{campaign.title}</strong><div className="muted">{campaign.targets[0]?.class.course.name} · {campaign._count.submissions}/{campaign._count.participations} phản hồi</div></div><span className="pill">{campaign.status}</span></div><div className="actions" style={{marginTop: ".8rem"}}>{campaign.status === "DRAFT" && <form action={publishCampaign}><input type="hidden" name="id" value={campaign.id}/><button className="button">Công bố</button></form>}{campaign.status === "PUBLISHED" && <form action={closeCampaign}><input type="hidden" name="id" value={campaign.id}/><button className="button danger">Đóng khảo sát</button></form>}</div></div>)}</div>}</article>
  </AppShell>;
}
