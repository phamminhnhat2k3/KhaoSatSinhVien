import {RoleTags} from "@/components/RoleTags";
import { EntityDetails } from "@/components/EntityDetails";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/access";
import { AppShell } from "@/components/AppShell";
import { UserStateForm } from "@/components/ManagementForms";
import { LecturerForm } from "@/components/LecturerForm";
export default async function LecturersPage() {
  const user = await requireUser();
  const admin = user.roles.includes("ADMIN");
  const own = await db.lecturerProfile.findUnique({ where: { userId: user.id } });
  if (!admin && (!user.roles.includes("DEAN") || !own?.facultyId)) notFound();
  const where = admin ? {} : { facultyId: own!.facultyId! };
  const [faculties, lecturers, courses] = await Promise.all([db.faculty.findMany({ where: admin ? {} : { id: own!.facultyId! } }), db.lecturerProfile.findMany({ where, include: { faculty: true, courses: true, user: { select: { name: true, email: true, phone: true, bio: true, roles: true } } }, orderBy: { lecturerCode: "asc" } }), db.course.findMany({ where, orderBy: { code: "asc" } })]);
  return <AppShell name={user.name} role={admin ? "Quản trị viên" : "Trưởng khoa"} wide><Link href={admin ? "/admin" : "/dean"}>← Trang quản lý</Link><h1>Giảng viên và phân quyền</h1><section className="card"><h2>Thêm giảng viên</h2><LecturerForm faculties={faculties} courses={courses} admin={admin}/></section><h2>Danh sách giảng viên ({lecturers.length})</h2><div className="stack">{lecturers.map(l => <details className="card" key={l.id}><summary>{l.lecturerCode} · {admin ? <EntityDetails type="user" id={l.userId} name={l.user.name}/> : l.user.name} · {l.faculty?.name ?? "Chưa phân khoa"}{" "}<RoleTags roles={l.user.roles.map(r=>r.role)}/></summary><p>{l.user.email} · {l.user.phone || "Chưa có số điện thoại"}</p><p>{l.user.bio}</p><p>Môn: {l.courses.map(c => admin ? <EntityDetails key={c.id} type="course" id={c.id} name={c.name}/> : c.name)}</p>{(admin || !l.user.roles.some(r => r.role === "DEAN")) && <LecturerForm faculties={faculties} courses={courses} admin={admin} lecturer={{ id: l.id, name: l.user.name, email: l.user.email, lecturerCode: l.lecturerCode, facultyId: l.facultyId, dean: l.user.roles.some(r => r.role === "DEAN"), phone: l.user.phone, courseIds: l.courses.map(c => c.id) }}/>}{admin && <div className="actions"><UserStateForm id={l.userId} operation="delete"/></div>}</details>)}</div></AppShell>;
}
