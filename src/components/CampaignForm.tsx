"use client";
import { startTransition, useActionState, useState } from "react";
import { createCampaign, publishCampaign } from "@/app/admin/actions";

type Option = { id: string; label: string };
export function CampaignForm({ faculties, semesters, templates, courses }: { faculties: Option[]; semesters: Option[]; templates: Option[]; courses: (Option & { semesterIds: string[] })[] }) {
  const [error, action, pending] = useActionState(createCampaign, undefined);
  const [scope, setScope] = useState("FACULTY");
  const [semester, setSemester] = useState(semesters[0]?.id ?? "");
  const [courseTemplate, setCourseTemplate] = useState("");
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
  const nextMonth = new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
  return <form className="stack" method="post" onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); startTransition(() => action(data)); }}>
    <label className="field">Tên đợt khảo sát<input className="input" name="title" required minLength={3} maxLength={120} placeholder="Đánh giá chất lượng học kỳ"/></label>
    <label className="field">Phạm vi khảo sát<select className="input" name="scope" value={scope} onChange={e => { setScope(e.target.value); setCourseTemplate(""); }}><option value="FACULTY">Theo khoa</option><option value="UNIVERSITY">Toàn trường</option></select></label>
    <label className="field">Học kỳ khảo sát<select className="input" name="semesterId" value={semester} onChange={e => setSemester(e.target.value)} required><option value="">Chọn học kỳ</option>{semesters.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
    {scope === "FACULTY" && <label className="field">Khoa tổ chức<select className="input" name="facultyId" required><option value="">Chọn khoa</option>{faculties.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></label>}
    <label className="field">Mẫu câu hỏi chung<select className="input" name="templateId" required><option value="">Chọn mẫu đã lưu</option>{templates.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
    {scope === "FACULTY" ? <section className="card stack"><h2>Đánh giá môn học (tùy chọn)</h2><p className="muted">Cùng một đợt của khoa, mỗi sinh viên chỉ nhận phần đánh giá cho môn mình thực học trong học kỳ này. Sinh viên không học các môn được chọn chỉ nhận phần chung.</p><label className="field">Mẫu đánh giá môn học<select className="input" name="courseTemplateId" value={courseTemplate} onChange={e => setCourseTemplate(e.target.value)}><option value="">Không thêm phần môn học</option>{templates.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>{courseTemplate && <fieldset className="question" key={`${semester}:${courseTemplate}`}><legend>Chọn môn trong phạm vi đánh giá</legend><div className="class-options">{courses.filter(c => c.semesterIds.includes(semester)).map(c => <label className="option" key={c.id}><input type="checkbox" name="courseIds" value={c.id}/>{c.label}</label>)}</div></fieldset>}</section> : <p className="notice">Tất cả sinh viên đang hoạt động đều nhận một phiếu chung, không phụ thuộc khoa, lớp hành chính hoặc môn học. Phù hợp khảo sát cơ sở vật chất, dịch vụ và chất lượng trường.</p>}
    <div className="grid" style={{ marginTop: 0 }}><label className="field">Bắt đầu<input className="input" name="startsAt" type="date" defaultValue={today} required/></label><label className="field">Kết thúc<input className="input" name="endsAt" type="date" defaultValue={nextMonth} required/></label></div>
    <p className="notice">Giờ Việt Nam: từ 00:00 ngày bắt đầu đến hết ngày cuối. Tạo nháp chưa giao phiếu; danh sách người nhận và môn học được chốt khi công bố.</p>
    {error && <p className="error" role="alert">{error}</p>}<button className="button" disabled={pending}>{pending ? "Đang tạo…" : "Tạo đợt khảo sát"}</button>
  </form>;
}
export function PublishForm({ campaignId }: { campaignId: string }) {
  const [error, action, pending] = useActionState(publishCampaign, undefined);
  return <form action={action} className="stack"><input type="hidden" name="id" value={campaignId}/>{error && <p role="alert" className="error">{error}</p>}<button className="button" disabled={pending}>{pending ? "Đang giao phiếu…" : "Công bố"}</button></form>;
}
