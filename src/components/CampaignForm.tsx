"use client";
import {useActionFeedback} from "./useActionFeedback";
import { startTransition, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { closeCampaign, createCampaign, updateCampaign, cancelCampaign, publishCampaign } from "@/app/admin/actions";

import { useUnsavedForm } from "@/lib/unsaved";
import { campaignDraftFromForm, readCampaignDraft } from "@/modules/survey-campaign/draft";

type Option = { id: string; label: string };
type Initial = { evaluationMode?:string;title:string;scope:string;facultyId:string;semesterId:string;templateId:string;courseTemplateId:string;courseIds:string[];academicClassIds?:string[];startsAt:string;endsAt:string };
function CampaignEditor({ faculties, semesters, templates, courses, academicClasses, initial, editId, draftKey, restored }: { draftKey:string;restored?:boolean;academicClasses: (Option & {facultyId:string;students:number;semesterIds:string[]})[]; faculties: Option[]; semesters: Option[]; templates: Option[]; courses: (Option & { semesterIds: string[]; facultyId: string | null })[]; initial?:Initial;editId?:string }) {
  const router = useRouter();
  const ref=useRef<HTMLFormElement>(null),[dirty,setDirty]=useState(false);
  const submitted=useRef(false);
  useEffect(()=>()=>{
    const url=new URL(window.location.href);
    const saved=editId ? url.pathname===`/admin/campaigns/${editId}/review`&&url.searchParams.get("saved")==="1" : url.pathname==="/admin"&&url.searchParams.get("created")==="1";
    if(submitted.current&&saved)try{localStorage.removeItem(draftKey);}catch{/* The server copy is already saved. */}
  },[draftKey,editId]);
  useUnsavedForm(ref,dirty,{label:"Đợt khảo sát đang soạn · Nháp trên trình duyệt này",save:()=>{
    if(!ref.current)return false;
    localStorage.setItem(draftKey,JSON.stringify(campaignDraftFromForm(new FormData(ref.current))));setDirty(false);return true;
  },discard:()=>{try{localStorage.removeItem(draftKey);}catch{/* Leave without writing the current changes when storage is blocked. */}setDirty(false);}});
  useEffect(() => {
    const refresh = () => router.refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [router]);
  const [error, action, pending] = useActionFeedback(async(previous:string|undefined,data:FormData)=>{
    const result=await(editId?updateCampaign:createCampaign)(previous,data);
    if(result)submitted.current=false;
    if(!result){try{localStorage.removeItem(draftKey);}catch{/* Server save already succeeded. */}setDirty(false);}return result;
  }, undefined);
  const [faculty, setFaculty] = useState(initial?.facultyId??"");
  const [scope, setScope] = useState(initial?.scope??"FACULTY");
  const [semester, setSemester] = useState(initial?.semesterId??"");
  const [selectedClasses, setSelectedClasses] = useState<string[]>(initial?.academicClassIds??[]);
  const [courseTemplate, setCourseTemplate] = useState(initial?.courseTemplateId??"");
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
  const nextMonth = new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
  return <form ref={ref} data-leave-managed className="stack" method="post" onChange={()=>setDirty(true)} onSubmit={e => { e.preventDefault(); submitted.current=true; const data = new FormData(e.currentTarget); startTransition(() => action(data)); }}>
    {restored&&<p className="notice" role="status">Đã khôi phục nội dung đang soạn trên trình duyệt này. Nội dung này chưa được công bố hay giao phiếu.</p>}
    {editId&&<input type="hidden" name="id" value={editId}/>}
    <div className="actions"><a className="button secondary" href="/admin/templates/new" target="_blank" rel="noopener noreferrer">Tạo mẫu khảo sát mới ↗</a><button className="button secondary" type="button" onClick={() => router.refresh()}>Cập nhật danh sách mẫu</button></div>
    <p className="muted">Tạo mẫu ở tab mới để giữ thông tin đợt đang nhập. Khi quay lại, danh sách mẫu sẽ tự cập nhật; bạn cũng có thể bấm Cập nhật danh sách mẫu.</p>
    <label className="field">Tên đợt khảo sát<input className="input" name="title" defaultValue={initial?.title} required minLength={3} maxLength={120} placeholder="Đánh giá chất lượng học kỳ"/></label>
    <label className="field">Phạm vi khảo sát<select className="input" name="scope" value={scope} onChange={e => { setScope(e.target.value); setCourseTemplate(""); setFaculty(""); setSelectedClasses([]); }}><option value="FACULTY">Theo khoa</option><option value="UNIVERSITY">Toàn trường</option></select></label>
    <section className="card stack"><h2>{scope === "FACULTY" ? "1. Chọn học kỳ → 2. Chọn khoa → 3. Chọn lớp hành chính" : "Học kỳ khảo sát toàn trường"}</h2>
    <label className="field">Học kỳ khảo sát<select className="input" name="semesterId" value={semester} onChange={e => {setSemester(e.target.value);setFaculty("");setSelectedClasses([]);}} required><option value="">Chọn học kỳ</option>{semesters.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
    {scope === "FACULTY" && <label className="field">Khoa tổ chức<select className="input" name="facultyId" value={faculty} onChange={e => {setFaculty(e.target.value);setSelectedClasses([]);}} disabled={!semester} required><option value="">Chọn khoa</option>{faculties.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></label>}
    {scope === "FACULTY" && <fieldset className="question" disabled={!semester || !faculty}><legend>Lớp hành chính nhận khảo sát</legend><p className="muted">Chọn một hoặc nhiều lớp trong khoa. Mỗi sinh viên nhận môn và giảng viên theo phân công của lớp trong học kỳ, trừ trường hợp đã điều chỉnh riêng.</p><div className="class-options">{academicClasses.filter(c => c.facultyId === faculty).map(c => <label className="option" key={c.id}><input type="checkbox" name="academicClassIds" value={c.id} checked={selectedClasses.includes(c.id)} onChange={e => setSelectedClasses(ids => e.target.checked ? [...ids,c.id] : ids.filter(id => id !== c.id))}/>{c.label} · {c.students} sinh viên{!c.semesterIds.includes(semester) && " · Chưa có phân công chung"}</label>)}</div>{faculty && !academicClasses.some(c => c.facultyId === faculty) && <p>Chưa có lớp hành chính trong khoa này.</p>}<p className="muted">Đã chọn {selectedClasses.length} lớp. <a className="text-button" href="/admin/assignments" target="_blank" rel="noopener noreferrer">Phân công môn và giảng viên cho lớp ↗</a></p></fieldset>}
    </section>
    <label className="field">Mẫu câu hỏi chung<select className="input" name="templateId" defaultValue={initial?.templateId??""} required><option value="">Chọn mẫu đã lưu</option>{templates.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
    {scope === "FACULTY" ? <section className="card stack"><h2>Đánh giá môn học (tùy chọn)</h2><p className="muted">Cùng một đợt của khoa, mỗi sinh viên chỉ nhận phần đánh giá cho môn mình thực học trong học kỳ này. Sinh viên không học các môn được chọn chỉ nhận phần chung.</p><label className="field">Mẫu đánh giá môn học<select className="input" name="courseTemplateId" value={courseTemplate} onChange={e => setCourseTemplate(e.target.value)}><option value="">Không thêm phần môn học</option>{templates.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>{courseTemplate&&<><label className="field">Đối tượng đánh giá<select className="input" name="evaluationMode" defaultValue={initial?.evaluationMode??"LECTURER"}><option value="COURSE">Chất lượng môn học (gộp chung môn)</option><option value="LECTURER">Từng giảng viên thực sự dạy lớp đã đăng ký</option></select></label><p className="muted">Phân công môn cho lớp hành chính tại trang Phân công học kỳ, giảng viên được lấy từ lớp học phần tương ứng. Mỗi môn và giảng viên chỉ nhận một phần, kể cả học nhiều lớp cùng người dạy.</p></>}{courseTemplate && <fieldset className="question" key={`${semester}:${faculty}:${courseTemplate}`}><legend>Chọn môn trong phạm vi đánh giá</legend><div className="class-options">{courses.filter(c => c.semesterIds.includes(semester) && c.facultyId === faculty).map(c => <label className="option" key={c.id}><input type="checkbox" name="courseIds" value={c.id} defaultChecked={initial?.semesterId===semester&&initial?.facultyId===faculty&&initial?.courseIds.includes(c.id)}/>{c.label}</label>)}</div></fieldset>}</section> : <p className="notice">Tất cả sinh viên đang hoạt động đều nhận một phiếu chung, không phụ thuộc khoa, lớp hành chính hoặc môn học. Phù hợp khảo sát cơ sở vật chất, dịch vụ và chất lượng trường.</p>}
    <div className="grid" style={{ marginTop: 0 }}><label className="field">Bắt đầu<input className="input" name="startsAt" type="date" defaultValue={initial?.startsAt??today} required/></label><label className="field">Kết thúc<input className="input" name="endsAt" type="date" defaultValue={initial?.endsAt??nextMonth} required/></label></div>
    <p className="notice">Giờ Việt Nam: từ 00:00 ngày bắt đầu đến hết ngày cuối. Tạo nháp chưa giao phiếu; danh sách người nhận và môn học được chốt khi công bố.</p>
    {editId&&<p className="notice">Chỉ chỉnh sửa đợt nháp. Đợt đã giao phiếu giữ nguyên danh sách môn và giảng viên đã chốt.</p>}
    {error && <p className="error" role="alert">{error}</p>}<button className="button" disabled={pending}>{pending ? "Đang lưu…" : editId?"Lưu bản nháp":"Tạo đợt khảo sát"}</button>
  </form>;
}
export function CampaignForm(props:Parameters<typeof CampaignEditor>[0]) {
  const [draft,setDraft]=useState<Initial|null>(null),[ready,setReady]=useState(false);
  useEffect(()=>{try{setDraft(readCampaignDraft(localStorage.getItem(props.draftKey)));}catch{/* Keep the server values when browser storage is unavailable. */}setReady(true);},[props.draftKey]);
  return ready?<CampaignEditor {...props} initial={draft??props.initial} restored={!!draft}/>:<p role="status">Đang tải biểu mẫu…</p>;
}
export function CancelCampaignForm({campaignId}:{campaignId:string}) {
  const [error,action,pending]=useActionFeedback(cancelCampaign,undefined);
  return <form action={action} className="stack"><input type="hidden" name="id" value={campaignId}/><label className="option"><input type="checkbox" name="confirm" value="yes" required/>Tôi xác nhận hủy đợt nháp này; giữ lại lịch sử.</label>{error&&<p role="alert" className="error">{error}</p>}<button className="button danger" disabled={pending}>Hủy bản nháp</button></form>;
}
export function PublishForm({ campaignId }: { campaignId: string }) {
  const [error, action, pending] = useActionFeedback(publishCampaign, undefined);
  return <form action={action} className="stack"><input type="hidden" name="id" value={campaignId}/>{error && <p role="alert" className="error">{error}</p>}<button className="button" disabled={pending}>{pending ? "Đang giao phiếu…" : "Công bố"}</button></form>;
}

export function CloseCampaignForm({id}:{id:string}) {
 const [error,action,pending]=useActionFeedback(closeCampaign,undefined);
 return <form action={action}><input type="hidden" name="id" value={id}/><button className="button danger" disabled={pending}>{pending?"Đang đóng…":"Đóng khảo sát"}</button>{error&&!error.startsWith("Đã ")&&<p role="alert" className="error">{error}</p>}</form>;
}
