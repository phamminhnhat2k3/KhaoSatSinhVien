import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { EntityDetails } from "@/components/EntityDetails";
import { RoleTags } from "@/components/RoleTags";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";

type Params = { q?: string; role?: string; classId?: string; page?: string };
export default async function DeanPeoplePage({ searchParams }: { searchParams: Promise<Params> }) {
  const actor = await requireUser("DEAN");
  const own = await db.lecturerProfile.findUnique({ where: { userId: actor.id }, include: { faculty: true } });
  const admin = actor.roles.includes("ADMIN");
  if (!admin && !own?.facultyId) return <AppShell name={actor.name} role="Trưởng khoa"><h1>Chưa phân khoa</h1><p>Quản trị viên cần gắn khoa cho hồ sơ của bạn.</p></AppShell>;
  const params = await searchParams, q = (params.q ?? "").trim().slice(0, 100);
  const role = ["STUDENT", "LECTURER", "DEAN"].includes(params.role ?? "") ? params.role : "";
  const faculty = admin ? {} : { facultyId: own!.facultyId! };
  const where: Prisma.UserWhereInput = { AND: [
    { OR: [{ lecturer: faculty }, { student: { academicClass: faculty } }] },
    ...(role ? [{ roles: { some: { role: role as "STUDENT" | "LECTURER" | "DEAN" } } }] : []),
    ...(params.classId && role !== "LECTURER" && role !== "DEAN" ? [{ student: { academicClassId: params.classId } }] : []),
    ...(q ? [{ OR: [{ name: { contains: q } }, { email: { contains: q } }, { student: { studentCode: { contains: q } } }, { lecturer: { lecturerCode: { contains: q } } }] }] : []),
  ] };
  const total = await db.user.count({ where });
  const pages = Math.max(1, Math.ceil(total / 20)), requested = Number(params.page ?? 1);
  const page = Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, pages) : 1;
  const [users, classes] = await Promise.all([
    db.user.findMany({ where, skip: (page - 1) * 20, take: 20, orderBy: [{ name: "asc" }, { id: "asc" }], include: { roles: true, student: { include: { academicClass: true } }, lecturer: true } }),
    db.academicClass.findMany({ where: faculty, orderBy: { code: "asc" } }),
  ]);
  function href(next: number) { const query = new URLSearchParams({ ...(q ? { q } : {}), ...(role ? { role } : {}), ...(params.classId ? { classId: params.classId } : {}), page: String(next) }); return `/dean/people?${query}`; }
  return <AppShell name={actor.name} role="Trưởng khoa" wide compact>
    <Link className="text-button" href="/dean">← Kết quả khảo sát của khoa</Link>
    <p className="eyebrow">{own?.faculty?.name ?? "Tất cả khoa"}</p><h1>Giảng viên và sinh viên trong khoa</h1>
    <p className="lead">Bấm tên để xem thông tin và tab Đánh giá. Trưởng khoa chỉ tra cứu trong khoa mình, không chỉnh sửa tài khoản.</p>
    <form className="card role-filters" method="get">
      <label className="field">Tìm người dùng<input className="input" name="q" defaultValue={q} placeholder="Tên, mã hoặc email" maxLength={100}/></label>
      <label className="field">Vai trò<select className="input" name="role" defaultValue={role}><option value="">Tất cả</option><option value="LECTURER">Giảng viên</option><option value="DEAN">Trưởng khoa</option><option value="STUDENT">Sinh viên</option></select></label>
      <label className="field">Lớp hành chính<select className="input" name="classId" defaultValue={params.classId ?? ""}><option value="">Tất cả lớp</option>{classes.map(c => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}</select></label>
      <div className="actions"><button className="button" type="submit">Lọc danh sách</button><Link href="/dean/people" className="text-button">Xóa bộ lọc</Link></div>
    </form>
    <h2 className="section-title">{total} người dùng phù hợp</h2>
    <div className="card table-wrap"><table><thead><tr><th>Họ tên</th><th>Vai trò</th><th>Mã nghiệp vụ / Lớp</th><th>Trạng thái</th></tr></thead><tbody>{users.map(user => <tr key={user.id}>
      <td><EntityDetails id={user.id} type="user" name={user.name}/><div className="muted">{user.email}</div></td>
      <td><RoleTags roles={user.roles.map(r => r.role)}/></td><td>{user.student?.studentCode ?? user.lecturer?.lecturerCode}<div className="muted">{user.student?.academicClass?.code ?? "Giảng viên trong khoa"}</div></td><td>{user.active ? "Đang hoạt động" : "Đã khóa"}</td>
    </tr>)}</tbody></table>{!users.length && <p>Không tìm thấy người dùng phù hợp.</p>}</div>
    {pages > 1 && <nav className="section-heading" aria-label="Phân trang trong khoa">{page > 1 && <Link href={href(page - 1)}>← Trang trước</Link>}<span>Trang {page}/{pages}</span>{page < pages && <Link href={href(page + 1)}>Trang sau →</Link>}</nav>}
  </AppShell>;
}
