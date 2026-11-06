import { studyGroupOption } from "@/modules/academic/study-options";
import { academicClassLabel } from "@/modules/academic/education";
import Link from "next/link";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { ClassStudyForm } from "@/components/StudyPlanForms";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";

export default async function AssignmentsPage() {
  const user = await requireUser(Role.ADMIN);
  const [semesters, faculties, classes, groups] = await Promise.all([
    db.semester.findMany({ orderBy: { startsAt: "desc" } }),
    db.faculty.findMany({ orderBy: { name: "asc" } }),
    db.academicClass.findMany({ include: { studyAssignments: true, _count: { select: { students: true } } }, orderBy: { code: "asc" } }),
    db.courseClass.findMany({ include: { course: true, semester: true, lecturer: { include: { user: true } }, teachings: { include: { lecturer: { include: { user: true } } } } }, orderBy: { code: "asc" } })
  ]);
  return <AppShell name={user.name} role="Quản trị viên" wide>
    <Link className="text-button" href="/admin">← Trung tâm điều hành</Link><p className="eyebrow">Học vụ</p><h1>Phân công học kỳ</h1>
    <p className="lead">Thiết lập môn học và giảng viên chung cho lớp hành chính. Sinh viên học khác được điều chỉnh riêng trong hồ sơ quản lý.</p>
    <div className="actions"><Link className="button secondary" href="/admin/classes/new">Tạo lớp học phần / Phân công giảng viên</Link><Link className="button secondary" href="/admin/users?role=STUDENT">Điều chỉnh sinh viên</Link><Link className="button" href="/admin/campaigns/new">Tạo đợt khảo sát</Link></div>
    <section className="card section-title"><ClassStudyForm semesters={semesters.map(s => ({ id: s.id, label: s.name }))} faculties={faculties.map(f => ({ id: f.id, label: f.name }))} classes={classes.map(c => ({ id: c.id, label: academicClassLabel(c), facultyId: c.facultyId, educationSystem: c.educationSystem, assignments: c.studyAssignments.map(a => a.classId), students: c._count.students }))} groups={groups.map(studyGroupOption)}/></section>
  </AppShell>;
}
