"use client";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createCampaign, updateCampaign, cancelCampaign, publishCampaign } from "@/app/admin/actions";

type Option = { id: string; label: string };
type Initial = { evaluationMode?:string;title:string;scope:string;facultyId:string;semesterId:string;templateId:string;courseTemplateId:string;courseIds:string[];startsAt:string;endsAt:string };
export function CampaignForm({ faculties, semesters, templates, courses, initial, editId }: { faculties: Option[]; semesters: Option[]; templates: Option[]; courses: (Option & { semesterIds: string[]; facultyId: string | null })[]; initial?:Initial;editId?:string }) {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => router.refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [router]);
  const [error, action, pending] = useActionState(editId?updateCampaign:createCampaign, undefined);
  const [faculty, setFaculty] = useState(initial?.facultyId??"");
  const [scope, setScope] = useState(initial?.scope??"FACULTY");
  const [semester, setSemester] = useState(initial?.semesterId??semesters[0]?.id??"");
  const [courseTemplate, setCourseTemplate] = useState(initial?.courseTemplateId??"");
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
  const nextMonth = new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
  return <form className="stack" method="post" onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); startTransition(() => action(data)); }}>
    {editId&&<input type="hidden" name="id" value={editId}/>}
    <div className="actions"><a className="button secondary" href="/admin/templates/new" target="_blank" rel="noopener noreferrer">Tạo mẫu khảo sát mới ↗</a><button className="button secondary" type="button" onClick={() => router.refresh()}>Cập nhật danh sách mẫu</button></div>
    <p className="muted">Tạo mẫu ở tab mới để giữ thông tin đợt đang nhập. Khi quay lại, danh sách mẫu sẽ tự cập nhật; bạn cũng có thể bấm Cập nhật danh sách mẫu.</p>
    <label className="field">Tên đợt khảo sát<input className="input" name="title" defaultValue={initial?.title} required minLength={3} maxLength={120} placeholder="Đánh giá chất lượng học kỳ"/></label>
    <label className="field">Phạm vi khảo sát<select className="input" name="scope" value={scope} onChange={e => { setScope(e.target.value); setCourseTemplate(""); }}><option value="FACULTY">Theo khoa</option><option value="UNIVERSITY">Toàn trường</option></select></label>
    <label className="field">Học kỳ khảo sát<select className="input" name="semesterId" value={semester} onChange={e => setSemester(e.target.value)} required><option value="">Chọn học kỳ</option>{semesters.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
    {scope === "FACULTY" && <label className="field">Khoa tổ chức<select className="input" name="facultyId" value={faculty} onChange={e => setFaculty(e.target.value)} required><option value="">Chọn khoa</option>{faculties.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></label>}
    <label className="field">Mẫu câu hỏi chung<select className="input" name="templateId" defaultValue={initial?.templateId??""} required><option value="">Chọn mẫu đã lưu</option>{templates.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
    {scope === "FACULTY" ? <section className="card stack"><h2>Đánh giá môn học (tùy chọn)</h2><p className="muted">Cùng một đợt của khoa, mỗi sinh viên chỉ nhận phần đánh giá cho môn mình thực học trong học kỳ này. Sinh viên không học các môn được chọn chỉ nhận phần chung.</p><label className="field">Mẫu đánh giá môn học<select className="input" name="courseTemplateId" value={courseTemplate} onChange={e => setCourseTemplate(e.target.value)}><option value="">Không thêm phần môn học</option>{templates.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>{courseTemplate&&<><label className="field">Đối tượng đánh giá<select className="input" name="evaluationMode" defaultValue={initial?.evaluationMode??"COURSE"}><option value="COURSE">Chất lượng môn học (gộp chung môn)</option><option value="LECTURER">Từng giảng viên thực sự dạy lớp đã đăng ký</option></select></label><p className="muted">Đánh giá giảng viên cần phân công ở trang Lớp học phần. Mỗi môn và giảng viên chỉ nhận một phần, kể cả học nhiều lớp cùng người dạy.</p></>}{courseTemplate && <fieldset className="question" key={`${semester}:${faculty}:${courseTemplate}`}><legend>Chọn môn trong phạm vi đánh giá</legend><div className="class-options">{courses.filter(c => c.semesterIds.includes(semester) && c.facultyId === faculty).map(c => <label className="option" key={c.id}><input type="checkbox" name="courseIds" value={c.id} defaultChecked={initial?.semesterId===semester&&initial?.facultyId===faculty&&initial?.courseIds.includes(c.id)}/>{c.label}</label>)}</div></fieldset>}</section> : <p className="notice">Tất cả sinh viên đang hoạt động đều nhận một phiếu chung, không phụ thuộc khoa, lớp hành chính hoặc môn học. Phù hợp khảo sát cơ sở vật chất, dịch vụ và chất lượng trường.</p>}
    <div className="grid" style={{ marginTop: 0 }}><label className="field">Bắt đầu<input className="input" name="startsAt" type="date" defaultValue={initial?.startsAt??today} required/></label><label className="field">Kết thúc<input className="input" name="endsAt" type="date" defaultValue={initial?.endsAt??nextMonth} required/></label></div>
    <p className="notice">Giờ Việt Nam: từ 00:00 ngày bắt đầu đến hết ngày cuối. Tạo nháp chưa giao phiếu; danh sách người nhận và môn học được chốt khi công bố.</p>
    {editId&&<p className="notice">Lưu chỉnh sửa sẽ xóa kết quả xét duyệt cũ và gửi khoa duyệt lại. Đợt đã giao phiếu không thể chỉnh sửa.</p>}
    {error && <p className="error" role="alert">{error}</p>}<button className="button" disabled={pending}>{pending ? "Đang lưu…" : editId?"Lưu bản nháp":"Tạo đợt khảo sát"}</button>
  </form>;
}
export function CancelCampaignForm({campaignId}:{campaignId:string}) {
  const [error,action,pending]=useActionState(cancelCampaign,undefined);
  return <form action={action} className="stack"><input type="hidden" name="id" value={campaignId}/><label className="option"><input type="checkbox" name="confirm" value="yes" required/>Tôi xác nhận hủy đợt nháp này; giữ lại lịch sử.</label>{error&&<p role="alert" className="error">{error}</p>}<button className="button danger" disabled={pending}>Hủy bản nháp</button></form>;
}
export function PublishForm({ campaignId }: { campaignId: string }) {
  const [error, action, pending] = useActionState(publishCampaign, undefined);
  return <form action={action} className="stack"><input type="hidden" name="id" value={campaignId}/>{error && <p role="alert" className="error">{error}</p>}<button className="button" disabled={pending}>{pending ? "Đang giao phiếu…" : "Công bố"}</button></form>;
}
