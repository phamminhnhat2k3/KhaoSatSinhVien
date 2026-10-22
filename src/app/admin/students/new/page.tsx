import Link from "next/link";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { StudentForm } from "@/components/AcademicForms";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";

export default async function NewStudentPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const user = await requireUser(Role.ADMIN);
  const classes = await db.courseClass.findMany({ include: { course: true }, orderBy: { code: "asc" } });
  return <AppShell name={user.name} role="Quản trị viên" wide><Link className="text-button" href="/admin">← Trung tâm điều hành</Link><p className="eyebrow">Quản lý sinh viên</p><h1>Tạo và ghi danh sinh viên</h1><p className="lead">Tạo tài khoản mới và ghi danh vào lớp trong cùng một thao tác.</p>{(await searchParams).saved && <p className="notice" role="status">Đã tạo tài khoản sinh viên và ghi danh thành công.</p>}<section className="card"><h2>Hồ sơ sinh viên mới</h2><p className="notice">Email và mã sinh viên phải là duy nhất. Cung cấp mật khẩu khởi tạo qua kênh riêng; sinh viên có thể đổi mật khẩu trong hồ sơ.</p>{classes.length ? <StudentForm classes={classes.map(c => ({ id: c.id, label: `${c.code} · ${c.course.name}` }))}/> : <div className="empty-state"><p>Chưa có lớp để ghi danh.</p><Link className="button" href="/admin/classes/new">Tạo lớp học phần</Link></div>}</section></AppShell>;
}
