"use client";
import { useState } from "react";
import { assignClassStudy, adjustStudentStudy } from "@/app/admin/assignments/actions";
import { educationSystem } from "@/modules/academic/education";
import { groupStudyCourses, type StudyGroup } from "@/modules/academic/study-options";
import { useActionFeedback } from "./useActionFeedback";
import styles from "./StudyPlanForms.module.css";

type Option = { id: string; label: string };
type ClassOption = Option & { facultyId: string; educationSystem: string; assignments: string[]; students: number };

function CourseAssignments({ groups, selectedIds, system }: { groups: StudyGroup[]; selectedIds: string[]; system: string }) {
  const courses = groupStudyCourses(groups);
  const [search, setSearch] = useState("");
  const query = search.trim().toLocaleLowerCase("vi");
  const visibleCourses = courses.filter(course => [course.code, course.name, ...course.groups.flatMap(group => [group.code, group.teacherName])].join(" ").toLocaleLowerCase("vi").includes(query));
  const initial = Object.fromEntries(courses.map(course => {
    const chosen = course.groups.filter(g => selectedIds.includes(g.id));
    return [course.id, chosen.length === 1 ? chosen[0].id : ""];
  }));
  const [choices, setChoices] = useState(initial);
  const changed = courses.filter(c => choices[c.id] !== initial[c.id]).length;
  return <>
    <div className={styles.summary}><strong>{Object.values(choices).filter(Boolean).length}/{courses.length} môn đã chọn</strong><span className="muted">{educationSystem(system).name} · Mỗi môn một giảng viên</span>{changed > 0 && <span className={styles.changed}>{changed} môn thay đổi, chưa lưu</span>}</div>
    {!courses.length && <p className="notice">Chưa có môn học phù hợp học kỳ, khoa và hệ học đã chọn. Tạo lớp học phần và phân công giảng viên trước.</p>}
    {!!courses.length && <label className="field">Tìm môn hoặc giảng viên<input className="input" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Mã môn, tên môn, lớp học phần hoặc giảng viên"/></label>}
    {!!courses.length && !visibleCourses.length && <p role="status">Không tìm thấy môn hoặc giảng viên phù hợp.</p>}
    <div className={styles.courses}>{courses.map(course => {
      const chosen = course.groups.find(g => g.id === choices[course.id]);
      const invalid = !!chosen && (!chosen.eligible || chosen.educationSystem !== system);
      const conflict = course.groups.filter(g => selectedIds.includes(g.id)).length > 1;
      return <article className={styles.course} key={course.id} hidden={!visibleCourses.includes(course)}>
        <span className={styles.code}>{course.code}</span><h3>{course.name}</h3>
        <label className="field">Giảng viên môn {course.code}<select className="input" name="classIds" data-course-id={course.id} value={choices[course.id]} onChange={e => setChoices(current => ({ ...current, [course.id]: e.target.value }))} aria-invalid={invalid || undefined} ref={element => { element?.setCustomValidity(invalid ? "Chọn một giảng viên đang hoạt động và đúng hệ học, hoặc bỏ môn này." : ""); }}>
          <option value="">Không học môn này</option>{course.groups.map(g => <option key={g.id} value={g.id} disabled={!g.eligible || g.educationSystem !== system}>{g.teacherName} · {g.code}{g.educationSystem !== system ? " · Khác hệ học" : ""}</option>)}
        </select></label>
        {invalid ? <p className="error">Phân công hiện tại chưa hợp lệ. Cần chọn lại một giảng viên phù hợp.</p> : chosen ? <p className="muted">Nhóm học: {chosen.code}</p> : <p className="muted">Môn này chưa nằm trong phân công.</p>}
        {conflict && <p className="notice">Dữ liệu cũ có nhiều nhóm cùng môn. Chọn lại một giảng viên, hoặc bỏ môn để gỡ phân công cũ.</p>}
      </article>;
    })}</div>
  </>;
}

export function ClassStudyForm({ semesters, faculties, classes, groups }: { semesters: Option[]; faculties: Option[]; classes: ClassOption[]; groups: StudyGroup[] }) {
  const [semester, setSemester] = useState("");
  const [faculty, setFaculty] = useState("");
  const [academicClass, setAcademicClass] = useState("");
  const [message, action, pending] = useActionFeedback(assignClassStudy, undefined);
  const selected = classes.find(c => c.id === academicClass);
  return <form action={action} className="stack">
    <div className="grid" style={{ marginTop: 0 }}>
      <label className="field">Học kỳ phân công<select className="input" name="semesterId" value={semester} onChange={e => setSemester(e.target.value)} required><option value="">Chọn học kỳ</option>{semesters.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
      <label className="field">Khoa của lớp<select className="input" value={faculty} onChange={e => { setFaculty(e.target.value); setAcademicClass(""); }} disabled={!semester} required><option value="">Chọn khoa</option>{faculties.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></label>
      <label className="field">Lớp hành chính được phân công<select className="input" name="academicClassId" value={academicClass} onChange={e => setAcademicClass(e.target.value)} disabled={!faculty} required><option value="">Chọn lớp hành chính</option>{classes.filter(c => c.facultyId === faculty).map(c => <option key={c.id} value={c.id}>{c.label} · {c.students} sinh viên</option>)}</select></label>
    </div>
    {selected && <fieldset className="question"><legend>Môn học và giảng viên học chung</legend><p className="muted">Mỗi môn chỉ chọn một giảng viên. Danh sách đã lọc theo học kỳ, khoa và hệ của lớp. Chọn “Không học môn này” để gỡ môn khỏi phân công.</p><CourseAssignments key={`${semester}:${academicClass}:${selected.assignments.join(",")}`} system={selected.educationSystem} selectedIds={selected.assignments} groups={groups.filter(g => g.semesterId === semester && g.facultyId === faculty && (g.educationSystem === selected.educationSystem || selected.assignments.includes(g.id)))}/></fieldset>}
    <p className="notice">Sinh viên hiện tại và sinh viên được thêm vào lớp sau này đều dùng phân công chung, trừ người đã được thiết lập môn học riêng trong học kỳ. Việc sửa phân công không đổi phiếu đã công bố.</p>
    {message && <p role="status" className={message.startsWith("Đã ") ? "notice" : "error"}>{message}</p>}
    <button className="button" disabled={pending || !selected}>{pending ? "Đang lưu…" : "Lưu phân công cho lớp"}</button>
  </form>;
}

export function StudentStudyForm({ studentId, facultyId, system, semesters, groups, inheritedIds, personalIds, overrideSemesters }: { studentId: string; facultyId?: string; system?: string; semesters: Option[]; groups: StudyGroup[]; inheritedIds: string[]; personalIds: string[]; overrideSemesters: string[] }) {
  const [semester, setSemester] = useState(semesters[0]?.id ?? "");
  const [message, action, pending] = useActionFeedback(adjustStudentStudy, undefined);
  const overridden = overrideSemesters.includes(semester);
  const selected = overridden ? personalIds : [...inheritedIds, ...personalIds];
  return <form action={action} className="stack"><input type="hidden" name="studentId" value={studentId}/>
    <label className="field">Học kỳ điều chỉnh riêng<select className="input" name="semesterId" value={semester} onChange={e => setSemester(e.target.value)} required>{semesters.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
    <p className="notice">{overridden ? "Đang dùng danh sách riêng trong học kỳ này." : "Mặc định theo phân công lớp và các đăng ký bổ sung hiện có."} Chỉ điều chỉnh nếu sinh viên học khác lớp. Mỗi môn chọn một giảng viên, hoặc chọn “Không học môn này” nếu được miễn.</p>
    <fieldset className="question" disabled={!facultyId || !system}><legend>Toàn bộ môn thực học của sinh viên</legend><CourseAssignments key={`${semester}:${selected.join(",")}`} system={system ?? ""} selectedIds={selected} groups={groups.filter(g => g.semesterId === semester && g.facultyId === facultyId && (g.educationSystem === system || selected.includes(g.id)))}/></fieldset>
    <p className="muted">Lưu danh sách riêng sẽ thay đăng ký của học kỳ đang chọn. Không chọn môn nào nghĩa là không học môn nào trong học kỳ. Các học kỳ khác và phiếu đã giao được giữ nguyên.</p>
    {message && <p role="status" className={message.startsWith("Đã ") ? "notice" : "error"}>{message}</p>}
    <div className="actions"><button className="button" name="operation" value="save" disabled={pending || !facultyId}>Lưu môn học riêng</button><button className="button secondary" name="operation" value="reset" formNoValidate disabled={pending || !facultyId}>Dùng lại phân công chung</button></div>
  </form>;
}
