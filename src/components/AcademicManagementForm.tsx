"use client";
import { manageAcademic } from "@/app/admin/academic/manage";
import { educationSystems } from "@/modules/academic/education";
import { useActionFeedback } from "./useActionFeedback";

type Option = { id: string; label: string };
type Item = { id: string; code?: string; name?: string; facultyId?: string | null; educationSystem?: string; courseId?: string; semesterId?: string; capacity?: number; startsAt?: string; endsAt?: string };
export function AcademicManagementForm({ kind, item, faculties = [], semesters = [], courses = [], remove = false }: { kind: "Semester" | "AcademicClass" | "Course" | "CourseClass"; item: Item; faculties?: Option[]; semesters?: Option[]; courses?: Option[]; remove?: boolean }) {
  const [message, action, pending] = useActionFeedback(manageAcademic, undefined);
  const label = { Semester: "học kỳ", AcademicClass: "lớp hành chính", Course: "môn học", CourseClass: "lớp học phần" }[kind];
  const select = (name: string, title: string, options: Option[], value?: string | null) => <label className="field">{title}<select className="input" name={name} defaultValue={value ?? ""} required><option value="">Chọn {title.toLocaleLowerCase("vi")}</option>{options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select></label>;
  return <form action={action} className="stack" onSubmit={e => { if (remove && !window.confirm(`Xóa ${label} ${item.name ?? item.code}? Chỉ xóa được khi không còn dữ liệu phụ thuộc.`)) e.preventDefault(); }}>
    <input type="hidden" name="kind" value={kind}/><input type="hidden" name="id" value={item.id}/><input type="hidden" name="operation" value={remove ? "delete" : "update"}/>
    {!remove && <>
      {kind !== "Semester" && <label className="field">{kind === "CourseClass" ? "Mã lớp học phần" : `Mã ${label}`}<input className="input" name="code" defaultValue={item.code} minLength={2} maxLength={kind === "AcademicClass" || kind === "CourseClass" ? 30 : 60} required/></label>}
      {kind !== "CourseClass" && <label className="field">Tên {label}<input className="input" name="name" defaultValue={item.name} minLength={3} maxLength={120} required/></label>}
      {kind === "Semester" && <><label className="field">Ngày bắt đầu<input className="input" type="date" name="startsAt" defaultValue={item.startsAt} required/></label><label className="field">Ngày kết thúc<input className="input" type="date" name="endsAt" defaultValue={item.endsAt} required/></label><p className="muted">Học kỳ đã có dữ liệu chỉ đổi được tên, giữ nguyên thời gian để bảo toàn phân công và khảo sát.</p></>}
      {(kind === "AcademicClass" || kind === "Course") && select("facultyId", "Khoa", faculties, item.facultyId)}
      {kind === "CourseClass" && <>{select("courseId", "Môn học", courses, item.courseId)}{select("semesterId", "Học kỳ", semesters, item.semesterId)}<label className="field">Sĩ số<input className="input" type="number" name="capacity" min={1} max={10000} defaultValue={item.capacity} required/></label></>}
      {(kind === "AcademicClass" || kind === "CourseClass") && select("educationSystem", "Hệ học", Object.entries(educationSystems).map(([id, s]) => ({ id, label: s.name })), item.educationSystem)}
      {kind !== "Semester" && <p className="muted">Có thể sửa mã, tên và thông tin cơ bản. Hệ thống chặn thay đổi khoa, môn hoặc học kỳ nếu làm lệch dữ liệu đã phân công.</p>}
    </>}
    {remove && <p className="muted">Không xóa kèm sinh viên, phân công hoặc lịch sử khảo sát. Nếu danh mục còn được dùng, hệ thống sẽ nêu lý do.</p>}
    {message && <p role="status">{message}</p>}
    <button className={`button${remove ? " danger" : ""}`} disabled={pending}>{pending ? "Đang xử lý…" : remove ? `Xóa ${label}` : `Lưu ${label}`}</button>
  </form>;
}
