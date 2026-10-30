import {ClassTeachingForm} from "@/components/ClassTeachingForm";
import { EntityDetails } from "@/components/EntityDetails";
import Link from "next/link";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { CourseClassForm } from "@/components/AcademicForms";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";

export default async function NewClassPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const user = await requireUser(Role.ADMIN);
  const [semesters, faculties, classes,teachers] = await Promise.all([db.semester.findMany({ orderBy: { startsAt: "desc" } }), db.faculty.findMany(), db.courseClass.findMany({ include: {teachings:{include:{lecturer:{include:{user:true}}}},lecturer:{include:{user:true}}, course: { include: { faculty: true } }, semester: true, _count: { select: { enrollments: true } } }, orderBy: { code: "asc" } }),db.lecturerProfile.findMany({where:{user:{active:true,roles:{some:{role:"LECTURER"}}}},include:{user:{select:{name:true}}},orderBy:{lecturerCode:"asc"}})]);
  return <AppShell name={user.name} role="Quản trị viên" wide>
    <div className="section-heading"><Link className="text-button" href="/admin">← Trung tâm điều hành</Link><Link className="text-button" href="/admin/academic">Khoa / Lớp hành chính / Học kỳ →</Link></div>
    <p className="eyebrow">Đăng ký môn học</p><h1>Tạo học phần và lớp học phần</h1><p className="lead">Lớp học phần là lớp học một môn trong một học kỳ, chứa sinh viên theo hệ đào tạo và sĩ số. Lớp hành chính quản lý sinh viên theo khoa và được tạo riêng trong Danh mục học vụ.</p>
    {(await searchParams).saved && <p className="notice" role="status">Đã tạo lớp học phần.</p>}
    <section className="card"><h2>Thông tin lớp học phần mới</h2><p className="muted">Nếu mã học phần đã tồn tại, nhập đúng tên hiện có. Mã lớp học phần phải duy nhất.</p>{semesters.length && faculties.length ? <CourseClassForm semesters={semesters.map(s => ({ id: s.id, label: s.name }))} faculties={faculties.map(l => ({ id: l.id, label: l.name }))}/> : <p className="notice">Cần bổ sung học kỳ và khoa trước khi tạo lớp học phần.</p>}</section>
    <h2 className="section-title">Các lớp học phần hiện có</h2><div className="card table-wrap"><table><thead><tr><th>Mã lớp học phần</th><th>Môn học</th><th>Học kỳ</th><th>Khoa / Hệ / Sĩ số</th><th>Giảng viên thực dạy</th></tr></thead><tbody>{classes.map(c => <tr key={c.id}><td>{c.code}</td><td>{c.course.code} · <EntityDetails type="course" id={c.course.id} name={c.course.name}/></td><td>{c.semester.name}</td><td>{`${c.course.faculty?.name ?? "Chưa phân khoa"} · ${({ REGULAR: "Chính quy", PART_TIME: "Vừa học vừa làm", DISTANCE: "Đào tạo từ xa" }[c.educationSystem] ?? c.educationSystem)} · ${c._count.enrollments}/${c.capacity}`}</td><td><p>{c.teachings.length?c.teachings.map(t=>t.lecturer.user.name).join(", "):c.teachingConfigured?"Chưa phân công":c.lecturer?.user.name??"Chưa phân công"}</p><ClassTeachingForm classId={c.id} teachers={teachers.filter(t=>t.facultyId===c.course.facultyId).map(t=>({id:t.id,name:t.user.name}))} selected={c.teachings.length?c.teachings.map(t=>t.lecturerId):c.teachingConfigured?[]:c.lecturerId?[c.lecturerId]:[]}/></td></tr>)}</tbody></table>{!classes.length && <p>Chưa có lớp học phần.</p>}</div>
  </AppShell>;
}
