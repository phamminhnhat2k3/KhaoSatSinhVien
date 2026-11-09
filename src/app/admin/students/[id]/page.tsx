import { studyGroupOption } from "@/modules/academic/study-options";
import { academicClassLabel } from "@/modules/academic/education";
import { StudentStudyForm } from "@/components/StudyPlanForms";
import { EntityDetails } from "@/components/EntityDetails";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { EnrollmentForm, PlacementForm } from "@/components/AcademicSetupForms";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/access";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(Role.ADMIN);
  const student = await db.studentProfile.findUnique({ where: { id: (await params).id }, include: { studyPlans:true, user: { select: { name: true, email: true, active: true } }, academicClass: { include: { faculty: true, studyAssignments:true } }, enrollments: { include: { class: { include: { course: true, semester: true } } }, orderBy: { class: { semester: { startsAt: "desc" } } } } } });
  if (!student) notFound();
  const [classes, semesters, courseClasses] = await Promise.all([db.academicClass.findMany({ include: { faculty: true }, orderBy: { code: "asc" } }), db.semester.findMany({ orderBy: { startsAt: "desc" } }), db.courseClass.findMany({ include: { course: true, lecturer:{include:{user:true}},teachings:{include:{lecturer:{include:{user:true}}}} }, orderBy: { code: "asc" } })]);
  return <AppShell name={user.name} role="Quản trị viên" wide><Link className="text-button" href="/admin/users">← Tất cả người dùng</Link><p className="eyebrow">{student.studentCode}</p><h1><EntityDetails type="user" id={student.userId} name={student.user.name}/></h1><p className="lead">{student.user.email} · {student.academicClass?.faculty.name ?? "Chưa phân khoa"} · {student.academicClass ? academicClassLabel(student.academicClass) : "Chưa phân lớp"}</p><div className="grid"><section className="card"><h2>Phân khoa / lớp hành chính</h2><PlacementForm studentId={student.id} currentId={student.academicClassId} classes={classes.map(c => ({ id: c.id, label: `${academicClassLabel(c)} · ${c.faculty.name}` }))}/></section><section className="card"><h2>Đăng ký môn học</h2><EnrollmentForm studentId={student.id} semesters={semesters.map(s => ({ id: s.id, label: s.name }))} classes={courseClasses.filter(c => student.academicClass && c.course.facultyId === student.academicClass.facultyId && c.educationSystem === student.academicClass.educationSystem).map(c => ({ id: c.id, label: `${c.code} · ${c.course.name}`, semesterId: c.semesterId }))}/></section></div><section className="card section-title"><h2>Điều chỉnh môn học riêng</h2><StudentStudyForm studentId={student.id} facultyId={student.academicClass?.facultyId} system={student.academicClass?.educationSystem} semesters={semesters.map(s=>({id:s.id,label:s.name}))} groups={courseClasses.map(studyGroupOption)} inheritedIds={student.academicClass?.studyAssignments.map(a=>a.classId)??[]} personalIds={student.enrollments.map(e=>e.classId)} overrideSemesters={student.studyPlans.map(p=>p.semesterId)}/></section><h2 className="section-title">Các lớp học phần đã ghi danh riêng</h2><div className="card table-wrap"><table><thead><tr><th>Học kỳ</th><th>Môn học</th><th>Lớp học phần</th></tr></thead><tbody>{student.enrollments.map(e => <tr key={e.classId}><td>{e.class.semester.name}</td><td>{e.class.course.code} · <EntityDetails type="course" id={e.class.course.id} name={e.class.course.name}/></td><td>{e.class.code}</td></tr>)}</tbody></table>{!student.enrollments.length && <p>Chưa đăng ký môn học.</p>}</div></AppShell>;
}
