import Link from "next/link";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { CourseClassForm } from "@/components/AcademicForms";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";

export default async function NewClassPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const user = await requireUser(Role.ADMIN);
  const [semesters, lecturers, classes] = await Promise.all([db.semester.findMany({ orderBy: { startsAt: "desc" } }), db.lecturerProfile.findMany({ include: { user: true } }), db.courseClass.findMany({ include: { course: true, semester: true, lecturer: { include: { user: true } } }, orderBy: { code: "asc" } })]);
  return <AppShell name={user.name} role="Quản trị viên" wide><Link className="text-button" href="/admin">← Trung tâm điều hành</Link><p className="eyebrow">Dữ liệu học vụ</p><h1>Tạo học phần và lớp</h1><p className="lead">Một học phần có thể có nhiều lớp. Mỗi lớp gắn với một học kỳ và giảng viên phụ trách.</p>{(await searchParams).saved && <p className="notice" role="status">Đã tạo lớp học phần.</p>}<section className="card"><h2>Thông tin lớp mới</h2><p className="muted">Nếu mã học phần đã tồn tại, nhập đúng tên hiện có. Mã lớp phải là duy nhất.</p>{semesters.length && lecturers.length ? <CourseClassForm semesters={semesters.map(s => ({ id: s.id, label: s.name }))} lecturers={lecturers.map(l => ({ id: l.id, label: `${l.lecturerCode} · ${l.user.name}` }))}/> : <p className="notice">Chưa có học kỳ hoặc giảng viên. Cần bổ sung dữ liệu học vụ trước khi tạo lớp.</p>}</section><h2 className="section-title">Các lớp hiện có</h2><div className="card table-wrap"><table><thead><tr><th>Mã lớp</th><th>Học phần</th><th>Học kỳ</th><th>Giảng viên</th></tr></thead><tbody>{classes.map(c => <tr key={c.id}><td>{c.code}</td><td>{c.course.code} · {c.course.name}</td><td>{c.semester.name}</td><td>{c.lecturer.user.name}</td></tr>)}</tbody></table>{!classes.length && <p>Chưa có lớp học phần.</p>}</div></AppShell>;
}
