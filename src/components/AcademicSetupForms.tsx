"use client";
import { useActionState, useState } from "react";
import { createAcademicClass, createFaculty, createSemester, enrollStudent, updatePlacement } from "@/app/admin/academic/actions";

type Option = { id: string; label: string };
function Message({ text }: { text?: string }) { return text ? <p className={text.startsWith("Đã ") ? "notice" : "error"} role="status">{text}</p> : null; }
export function FacultyForm() {
  const [message, action, pending] = useActionState(createFaculty, undefined);
  return <form action={action} className="stack"><label className="field">Mã khoa<input className="input" name="code" required minLength={2} maxLength={30} placeholder="CNTT"/></label><label className="field">Tên khoa<input className="input" name="name" required minLength={3} maxLength={120} placeholder="Công nghệ thông tin"/></label><Message text={message}/><button className="button" disabled={pending}>Tạo khoa</button></form>;
}
export function AcademicClassForm({ faculties }: { faculties: Option[] }) {
  const [message, action, pending] = useActionState(createAcademicClass, undefined);
  return <form action={action} className="stack"><label className="field">Khoa của lớp<select className="input" name="facultyId" required><option value="">Chọn khoa</option>{faculties.map(f => <option value={f.id} key={f.id}>{f.label}</option>)}</select></label><label className="field">Mã lớp hành chính<input className="input" name="code" required minLength={2} maxLength={30} placeholder="24110ST1"/></label><label className="field">Tên lớp hành chính<input className="input" name="name" required minLength={3} maxLength={120}/></label><Message text={message}/><button className="button" disabled={pending || !faculties.length}>Tạo lớp hành chính</button></form>;
}
export function SemesterForm() {
  const [message, action, pending] = useActionState(createSemester, undefined);
  return <form action={action} className="stack"><label className="field">Tên học kỳ<input className="input" name="name" required minLength={3} maxLength={120} placeholder="Học kỳ 1 · 2026–2027"/></label><label className="field">Ngày bắt đầu học kỳ<input className="input" type="date" name="startsAt" required/></label><label className="field">Ngày kết thúc học kỳ<input className="input" type="date" name="endsAt" required/></label><Message text={message}/><button className="button" disabled={pending}>Tạo học kỳ</button></form>;
}
export function PlacementForm({ studentId, currentId, classes }: { studentId: string; currentId: string | null; classes: Option[] }) {
  const [message, action, pending] = useActionState(updatePlacement, undefined);
  return <form action={action} className="stack"><input type="hidden" name="studentId" value={studentId}/><label className="field">Lớp hành chính<select className="input" name="academicClassId" defaultValue={currentId ?? ""} required><option value="">Chưa phân lớp</option>{classes.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label><p className="muted">Khoa được xác định theo lớp hành chính. Không dùng trường giới thiệu tự nhập của tài khoản.</p><Message text={message}/><button className="button" disabled={pending || !classes.length}>Lưu khoa/lớp</button></form>;
}
export function EnrollmentForm({ studentId, semesters, classes }: { studentId: string; semesters: Option[]; classes: (Option & { semesterId: string })[] }) {
  const [message, action, pending] = useActionState(enrollStudent, undefined);
  const [semester, setSemester] = useState(semesters[0]?.id ?? "");
  return <form action={action} className="stack"><input type="hidden" name="studentId" value={studentId}/><label className="field">Học kỳ ghi danh<select className="input" name="semesterId" value={semester} onChange={e => setSemester(e.target.value)} required>{semesters.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label><fieldset className="question" key={semester}><legend>Lớp học phần cần bổ sung</legend><div className="class-options">{classes.filter(c => c.semesterId === semester).map(c => <label className="option" key={c.id}><input type="checkbox" name="classIds" value={c.id}/>{c.label}</label>)}</div></fieldset><p className="muted">Chỉ bổ sung ghi danh, không xóa đăng ký hiện có. Cần ghi danh trước khi công bố đợt khảo sát.</p><Message text={message}/><button className="button" disabled={pending}>Bổ sung lớp học phần</button></form>;
}
