"use client";
import { useState } from "react";
import { assignClassStudy, adjustStudentStudy } from "@/app/admin/assignments/actions";
import { useActionFeedback } from "./useActionFeedback";

type Option = { id: string; label: string };
export type StudyGroup = Option & { semesterId: string; facultyId: string | null };
type ClassOption = Option & { facultyId: string; assignments: string[]; students: number };

export function ClassStudyForm({ semesters, faculties, classes, groups }: { semesters: Option[]; faculties: Option[]; classes: ClassOption[]; groups: StudyGroup[] }) {
  const [semester, setSemester] = useState("");
  const [faculty, setFaculty] = useState("");
  const [academicClass, setAcademicClass] = useState("");
  const [message, action, pending] = useActionFeedback(assignClassStudy, undefined);
  const selected = classes.find(c => c.id === academicClass);
  return <form action={action} className="stack">
    <div className="grid" style={{ marginTop: 0 }}>
      <label className="field">Học kỳ phân công<select className="input" name="semesterId" value={semester} onChange={e => { setSemester(e.target.value); setFaculty(""); setAcademicClass(""); }} required><option value="">Chọn học kỳ</option>{semesters.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
      <label className="field">Khoa của lớp<select className="input" value={faculty} onChange={e => { setFaculty(e.target.value); setAcademicClass(""); }} disabled={!semester} required><option value="">Chọn khoa</option>{faculties.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></label>
      <label className="field">Lớp hành chính được phân công<select className="input" name="academicClassId" value={academicClass} onChange={e => setAcademicClass(e.target.value)} disabled={!faculty} required><option value="">Chọn lớp hành chính</option>{classes.filter(c => c.facultyId === faculty).map(c => <option key={c.id} value={c.id}>{c.label} · {c.students} sinh viên</option>)}</select></label>
    </div>
    {selected && <fieldset className="question" key={`${semester}:${academicClass}:${selected.assignments.join(",")}`}><legend>Môn học và giảng viên học chung</legend><p className="muted">Chọn một lớp học phần cho mỗi môn. Giảng viên hiển thị là người thực dạy đã được phân công. Bỏ chọn môn để gỡ khỏi phân công chung của học kỳ.</p><div className="class-options">{groups.filter(g => g.semesterId === semester && g.facultyId === faculty).map(g => <label className="option" key={g.id}><input type="checkbox" name="classIds" value={g.id} defaultChecked={selected.assignments.includes(g.id)}/>{g.label}</label>)}</div></fieldset>}
    <p className="notice">Sinh viên hiện tại và sinh viên được thêm vào lớp sau này đều dùng phân công chung, trừ người đã được thiết lập môn học riêng trong học kỳ. Việc sửa phân công không đổi phiếu đã công bố.</p>
    {message && <p role="status" className={message.startsWith("Đã ") ? "notice" : "error"}>{message}</p>}
    <button className="button" disabled={pending || !selected}>{pending ? "Đang lưu…" : "Lưu phân công cho lớp"}</button>
  </form>;
}

export function StudentStudyForm({ studentId, facultyId, semesters, groups, inheritedIds, personalIds, overrideSemesters }: { studentId: string; facultyId?: string; semesters: Option[]; groups: StudyGroup[]; inheritedIds: string[]; personalIds: string[]; overrideSemesters: string[] }) {
  const [semester, setSemester] = useState(semesters[0]?.id ?? "");
  const [message, action, pending] = useActionFeedback(adjustStudentStudy, undefined);
  const overridden = overrideSemesters.includes(semester);
  const selected = overridden ? personalIds : [...inheritedIds, ...personalIds];
  return <form action={action} className="stack"><input type="hidden" name="studentId" value={studentId}/>
    <label className="field">Học kỳ điều chỉnh riêng<select className="input" name="semesterId" value={semester} onChange={e => setSemester(e.target.value)} required>{semesters.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
    <p className="notice">{overridden ? "Đang dùng danh sách riêng trong học kỳ này." : "Mặc định theo phân công lớp và các đăng ký bổ sung hiện có."} Chỉ điều chỉnh nếu sinh viên học khác lớp. Bỏ chọn môn được miễn, chọn lớp học phần khác nếu đổi giảng viên hoặc học lại.</p>
    <fieldset className="question" key={`${semester}:${selected.join(",")}`} disabled={!facultyId}><legend>Toàn bộ môn thực học của sinh viên</legend><div className="class-options">{groups.filter(g => g.semesterId === semester && g.facultyId === facultyId).map(g => <label className="option" key={g.id}><input type="checkbox" name="classIds" value={g.id} defaultChecked={selected.includes(g.id)}/>{g.label}</label>)}</div></fieldset>
    <p className="muted">Lưu danh sách riêng sẽ thay đăng ký của học kỳ đang chọn. Không chọn môn nào nghĩa là không học môn nào trong học kỳ. Các học kỳ khác và phiếu đã giao được giữ nguyên.</p>
    {message && <p role="status" className={message.startsWith("Đã ") ? "notice" : "error"}>{message}</p>}
    <div className="actions"><button className="button" name="operation" value="save" disabled={pending || !facultyId}>Lưu môn học riêng</button><button className="button secondary" name="operation" value="reset" disabled={pending || !facultyId}>Dùng lại phân công chung</button></div>
  </form>;
}
