import { educationSystem } from "@/modules/academic/education";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { entityReadAccess } from "@/modules/academic/entity-access";
export async function GET(request: Request) {
  const session = await auth();
  const actor = session?.user?.id ? await db.user.findUnique({ where: { id: session.user.id }, select: { active: true, roles: true, lecturer: { select: { facultyId: true } } } }) : null;
  const access = entityReadAccess(actor);
  if (!access) return Response.json({}, { status: 403 });
  const p = new URL(request.url).searchParams, id = p.get("id") ?? "", type = p.get("type");
  let name = "", fields: [string,string][] = [];
  let account: { id: string; active: boolean; email: string; manageable: boolean } | undefined;
  const links: { label: string; href: string }[] = [];
  if (type === "user") {
    const u = await db.user.findUnique({ where: { id }, select: { name: true, email: true, phone: true, bio: true, active: true, student: { include: { academicClass: { include: { faculty: true } }, _count: { select: { enrollments: true } } } }, lecturer: { include: { faculty: true, courses: true } } } });
    if (!u) return Response.json({}, { status: 404 });
    if (!access.admin && u.lecturer?.facultyId !== access.facultyId && u.student?.academicClass?.facultyId !== access.facultyId) return Response.json({}, { status: 403 });
    account = { id, active: u.active, email: u.email, manageable: access.admin && id !== session!.user.id };
    if (u.student && access.admin) links.push({ label: "Quản lý học vụ", href: `/admin/students/${u.student.id}` });
    name=u.name; fields=[["Email",u.email],["Điện thoại",u.phone || "Chưa cập nhật"],["Trạng thái",u.active ? "Đang hoạt động" : "Đã khóa"],["Khoa",u.lecturer?.faculty?.name ?? u.student?.academicClass?.faculty.name ?? "Chưa phân khoa"],["Mã nghiệp vụ",u.student?.studentCode ?? u.lecturer?.lecturerCode ?? "Quản trị viên"],["Lớp hành chính",u.student?.academicClass?.name ?? "Không áp dụng"],["Hệ học",u.student?.academicClass ? educationSystem(u.student.academicClass.educationSystem).name : "Không áp dụng"],["Môn giảng dạy",u.lecturer?.courses.map(c=>c.name).join(", ") || "Không áp dụng"],["Giới thiệu",u.bio || "Chưa có giới thiệu"]];
  } else if (type === "faculty") {
    const f=await db.faculty.findUnique({ where:{id}, include:{ _count:{select:{classes:true,lecturers:true,courses:true,campaigns:true}} } });
    if(!f) return Response.json({}, {status:404});
    if (!access.admin && id !== access.facultyId) return Response.json({}, { status: 403 });
    name=f.name; links.push({ label: "Sinh viên trong khoa", href: `${access.admin?`/admin/users?facultyId=${id}&role=STUDENT`:"/dean/people?role=STUDENT"}` }, { label: "Giảng viên trong khoa", href: `${access.admin?`/admin/users?facultyId=${id}&role=LECTURER`:"/dean/people?role=LECTURER"}` }); fields=[["Mã khoa",f.code],["Lớp hành chính",String(f._count.classes)],["Giảng viên",String(f._count.lecturers)],["Môn học",String(f._count.courses)],["Đợt khảo sát",String(f._count.campaigns)]];
  } else if(type === "course") {
    const c=await db.course.findUnique({where:{id},include:{faculty:true,lecturers:{select:{user:{select:{name:true}}}},_count:{select:{classes:true}}}});
    if(!c) return Response.json({}, {status:404});
    if (!access.admin && c.facultyId !== access.facultyId) return Response.json({}, { status: 403 });
    name=c.name; if(access.admin) links.push({ label: "Quản lý lớp học phần", href: "/admin/classes/new" }); links.push({ label: "Xem giảng viên của khoa", href: access.admin?`/admin/users?facultyId=${c.facultyId ?? ""}&role=LECTURER`:"/dean/people?role=LECTURER" }); fields=[["Mã môn",c.code],["Khoa",c.faculty?.name ?? "Chưa phân khoa"],["Giảng viên",c.lecturers.map(l=>l.user.name).join(", ") || "Chưa phân công"],["Lớp học phần",String(c._count.classes)]];
  } else return Response.json({}, {status:400});
  return Response.json({name,fields,account,links},{headers:{"Cache-Control":"private, no-store"}});
}
