"use client";

import { useActionState } from "react";
import { createCourseClass, createStudent } from "@/app/admin/actions";

type Option = { id: string; label: string };

export function CourseClassForm({ semesters, lecturers }: { semesters: Option[]; lecturers: Option[] }) {
  const [error, action, pending] = useActionState(createCourseClass, undefined);
  return <form action={action} className="stack">
    <div className="grid" style={{marginTop: 0}}><label className="field">Mã học phần<input className="input" name="courseCode" required placeholder="SE401" /></label><label className="field">Tên học phần<input className="input" name="courseName" required placeholder="Kiến trúc phần mềm" /></label></div>
    <label className="field">Mã lớp<input className="input" name="classCode" required placeholder="SE401.02" /></label>
    <label className="field">Học kỳ<select className="input" name="semesterId" required><option value="">Chọn học kỳ</option>{semesters.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    <label className="field">Giảng viên<select className="input" name="lecturerId" required><option value="">Chọn giảng viên</option>{lecturers.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    {error && <p className="error" role="alert">{error}</p>}<button className="button" disabled={pending}>{pending ? "Đang tạo…" : "Tạo lớp học phần"}</button>
  </form>;
}

export function StudentForm({ classes }: { classes: Option[] }) {
  const [error, action, pending] = useActionState(createStudent, undefined);
  return <form action={action} className="stack">
    <div className="grid" style={{marginTop: 0}}><label className="field">Họ tên<input className="input" name="name" required /></label><label className="field">Mã sinh viên<input className="input" name="studentCode" required /></label></div>
    <label className="field">Email<input className="input" name="email" type="email" required /></label>
    <label className="field">Mật khẩu khởi tạo<input className="input" name="password" type="password" minLength={8} autoComplete="new-password" required /></label>
    <label className="field">Ghi danh vào lớp<select className="input" name="classId" required><option value="">Chọn lớp</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    {error && <p className="error" role="alert">{error}</p>}<button className="button" disabled={pending}>{pending ? "Đang tạo…" : "Tạo và ghi danh sinh viên"}</button>
  </form>;
}
