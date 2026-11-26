"use client";
import {useActionFeedback} from "./useActionFeedback";

import { startTransition, useState } from "react";
import { createCourseClass, createStudent } from "@/app/admin/actions";

type Option = { id: string; label: string };

export function CourseClassForm({ semesters, faculties }: { semesters: Option[]; faculties: Option[] }) {
  const [error, action, pending] = useActionFeedback(createCourseClass, undefined);
  return <form action={action} className="stack">
    <div className="grid" style={{marginTop: 0}}><label className="field">Mã môn học<input className="input" name="courseCode" required placeholder="SE401" /></label><label className="field">Tên môn học<input className="input" name="courseName" required placeholder="Kiến trúc phần mềm" /></label></div>
    <p className="muted">Mã môn dùng chung cho môn học ở mọi học kỳ. Mỗi lớp học phần có mã riêng, thường dựa trên mã môn, ví dụ SE401.02.</p>
    <label className="field">Mã lớp học phần<input className="input" name="classCode" required placeholder="SE401.02" /></label>
    <label className="field">Học kỳ<select className="input" name="semesterId" required><option value="">Chọn học kỳ</option>{semesters.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    <label className="field">Khoa<select className="input" name="facultyId" required><option value="">Chọn khoa</option>{faculties.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></label>
    <label className="field">Hệ đào tạo<select className="input" name="educationSystem"><option value="REGULAR">Chính quy</option><option value="PART_TIME">Vừa học vừa làm</option><option value="DISTANCE">Đào tạo từ xa</option></select></label>
    <label className="field">Sĩ số<input className="input" name="capacity" type="number" min={1} max={10000} defaultValue={50} required/></label>
    {error && <p className="error" role="alert">{error}</p>}<button className="button" disabled={pending}>{pending ? "Đang tạo…" : "Tạo lớp học phần"}</button>
  </form>;
}

export function StudentForm({ classes, faculties, courseClasses }: { classes: (Option & { facultyId: string; educationSystem: string })[]; faculties: Option[]; courseClasses: (Option & { facultyId: string | null; educationSystem: string })[] }) {
  const [error, action, pending] = useActionFeedback(createStudent, undefined);
  const [faculty, setFaculty] = useState("");
  const [academicClass, setAcademicClass] = useState("");
  const selectedClass = classes.find(c => c.id === academicClass);
  return <form className="stack" method="post" onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); startTransition(() => action(data)); }}>
    <div className="grid" style={{marginTop: 0}}><label className="field">Họ tên<input className="input" name="name" required /></label><label className="field">Mã sinh viên<input className="input" name="studentCode" required /></label></div>
    <label className="field">Email<input className="input" name="email" type="email" required /></label>
    <label className="field">Mật khẩu khởi tạo<input className="input" name="password" type="password" minLength={8} autoComplete="new-password" required /></label>
    <label className="field">Khoa<select className="input" value={faculty} onChange={e => { setFaculty(e.target.value); setAcademicClass(""); }} required><option value="">Chọn khoa</option>{faculties.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></label>
    <label className="field">Lớp hành chính<select className="input" name="academicClassId" required value={academicClass} onChange={e => setAcademicClass(e.target.value)} disabled={!faculty}><option value="">Chọn lớp hành chính</option>{classes.filter(c => c.facultyId === faculty).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
    <fieldset className="question" key={academicClass}><legend><strong>Đăng ký lớp học phần (không bắt buộc)</strong></legend><p className="muted">Sinh viên dùng phân công chung của lớp. Chỉ bổ sung môn khác nếu cần, đúng khoa và hệ học. Đổi nhóm cùng môn tại phần Điều chỉnh môn học riêng.</p>{!selectedClass && <p>Chọn lớp hành chính để xem lớp học phần phù hợp.</p>}<div className="class-options">{courseClasses.filter(c => selectedClass && c.facultyId === selectedClass.facultyId && c.educationSystem === selectedClass.educationSystem).map(c => <label className="option" key={c.id}><input type="checkbox" name="courseClassIds" value={c.id}/>{c.label}</label>)}</div></fieldset>
    {error && <p className="error" role="alert">{error}</p>}<button className="button" disabled={pending}>{pending ? "Đang tạo…" : "Tạo sinh viên"}</button>
  </form>;
}
