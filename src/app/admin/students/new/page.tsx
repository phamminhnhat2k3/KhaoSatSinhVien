import { academicClassLabel } from "@/modules/academic/education";
import Link from "next/link";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { StudentForm } from "@/components/AcademicForms";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";

export default async function NewStudentPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const user = await requireUser(Role.ADMIN);
  const [classes, faculties, courseClasses] = await Promise.all([db.academicClass.findMany({ include: { faculty: true }, orderBy: { code: "asc" } }), db.faculty.findMany({ orderBy: { code: "asc" } }), db.courseClass.findMany({ include: { course: true, semester: true }, orderBy: { code: "asc" } })]);
  await searchParams;
  return <AppShell name={user.name} role="Quản trị viên" wide><div className="section-heading"><Link className="text-button" href="/admin/users">← Tất cả người dùng</Link><Link className="text-button" href="/admin/academic">Quản lý khoa / lớp hành chính →</Link></div><p className="eyebrow">Quản lý sinh viên</p><h1>Thêm sinh viên</h1><Link className="button secondary" href="/admin/lecturers?create=1#them-giang-vien">Thêm giảng viên / Cấp quyền Trưởng khoa</Link><p className="lead">Phân khoa theo lớp hành chính. Đăng ký lớp học phần là thông tin riêng, dùng để xác định môn sinh viên thực học.</p><section className="card"><h2>Hồ sơ sinh viên mới</h2><p className="notice">Email và mã sinh viên phải là duy nhất. Cung cấp mật khẩu khởi tạo qua kênh riêng; sinh viên có thể đổi mật khẩu trong hồ sơ.</p>{classes.length ? <StudentForm faculties={faculties.map(f => ({ id: f.id, label: f.name }))} classes={classes.map(c => ({ id: c.id, label: academicClassLabel(c), facultyId: c.facultyId }))} courseClasses={courseClasses.map(c => ({ id: c.id, label: `${c.code} · ${c.course.name} · ${c.semester.name}` }))}/> : <div className="empty-state"><p>Cần có khoa và lớp hành chính trước khi tạo sinh viên.</p><Link className="button" href="/admin/academic">Tạo khoa / lớp hành chính</Link></div>}</section></AppShell>;
}
