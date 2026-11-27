import { readFile } from "node:fs/promises";
import path from "node:path";
import { verify } from "argon2";
import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { userWhere } from "@/modules/academic/user-management";
import { roleLabels } from "@/modules/profile/rules";
import { accountPasswords } from "./passwords";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tài khoản mẫu", robots: { index: false, follow: false } };
type Params = { q?: string; role?: string; facultyId?: string; academicClassId?: string; page?: string };

export default async function AccountsPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireUser("ADMIN");
  const raw = await searchParams;
  const params = Object.fromEntries(Object.entries(raw).filter(([, value]) => typeof value === "string")) as Params;
  const where = userWhere(params);
  const total = await db.user.count({ where });
  const pages = Math.max(1, Math.ceil(total / 20));
  const page = Math.min(pages, Math.max(1, parseInt(params.page ?? "1", 10) || 1));
  const [users, faculties, classes, guide] = await Promise.all([
    db.user.findMany({ where, orderBy: [{ email: "asc" }, { id: "asc" }], skip: (page - 1) * 20, take: 20, select: { id: true, name: true, email: true, passwordHash: true, active: true, roles: true, lecturer: { select: { faculty: { select: { name: true } } } }, student: { select: { academicClass: { select: { code: true, faculty: { select: { name: true } } } } } } } }),
    db.faculty.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.academicClass.findMany({ where: params.facultyId ? { facultyId: params.facultyId } : {}, orderBy: { code: "asc" }, select: { id: true, code: true } }),
    readFile(path.join(process.cwd(), ".data", "account-guide", "TAI_KHOAN_MAU.md"), "utf8")
      .catch(() => readFile(path.join(process.cwd(), "TAI_KHOAN_MAU.md"), "utf8").catch(() => null)),
  ]);
  const passwords = accountPasswords(guide ?? "");
  const rows = [];
  for (const user of users) {
    const saved = passwords.get(user.email.toLowerCase());
    const matches = saved ? await verify(user.passwordHash, saved).catch(() => false) : false;
    rows.push({ id: user.id, name: user.name, email: user.email, active: user.active, roles: user.roles.map(r => roleLabels[r.role]).join(" · "), faculty: user.lecturer?.faculty?.name ?? user.student?.academicClass?.faculty.name ?? "—", home: user.student?.academicClass?.code ?? "—", password: matches ? saved : null, passwordState: saved ? "Mật khẩu đã thay đổi" : "Không có mật khẩu đã lưu" });
  }
  function href(next: number) {
    const query = new URLSearchParams();
    for (const key of ["q", "role", "facultyId", "academicClassId"] as const) if (params[key]) query.set(key, params[key]!);
    query.set("page", String(next));
    return `/accounts?${query}`;
  }
  return <main className={styles.page}>
    <Link href="/admin" className={styles.link}>← Quản trị</Link>
    <h1>Tài khoản đăng nhập</h1>
    <p>Mật khẩu mẫu lấy từ file tài khoản trên máy và được đối chiếu với database. Tài khoản đã đổi mật khẩu sẽ không hiện mật khẩu cũ.</p>
    {!guide && <p role="status">Không đọc được file TAI_KHOAN_MAU.md. Vẫn hiển thị danh sách tài khoản, không có mật khẩu để đối chiếu.</p>}
    <form method="get" className={styles.filters}>
      <label>Tìm kiếm<input name="q" defaultValue={params.q} placeholder="Tên, mã hoặc email" maxLength={100}/></label>
      <label>Vai trò<select name="role" defaultValue={params.role ?? ""}><option value="">Tất cả</option>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Khoa<select name="facultyId" defaultValue={params.facultyId ?? ""}><option value="">Tất cả khoa</option>{faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
      <label>Lớp<select name="academicClassId" defaultValue={params.academicClassId ?? ""}><option value="">Tất cả lớp</option>{classes.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}</select></label>
      <div className={styles.actions}><button type="submit">Lọc</button><Link href="/accounts">Xóa bộ lọc</Link></div>
    </form>
    <p><strong>{total}</strong> tài khoản phù hợp · Trang {page}/{pages}</p>
    <div className={styles.table}><table><thead><tr><th>Họ tên</th><th>Email đăng nhập</th><th>Mật khẩu</th><th>Vai trò</th><th>Khoa / Lớp</th><th>Trạng thái</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{row.name}</td><td><code>{row.email}</code></td><td>{row.password ? <code>{row.password}</code> : <span className={styles.muted}>{row.passwordState}</span>}</td><td>{row.roles}</td><td>{row.faculty}<small>{row.home}</small></td><td>{row.active ? "Hoạt động" : "Đã khóa"}</td></tr>)}</tbody></table>{!rows.length && <p>Không tìm thấy tài khoản phù hợp.</p>}</div>
    <nav className={styles.pagination} aria-label="Phân trang tài khoản">{page > 1 ? <Link href={href(page - 1)}>← Trước</Link> : <span/>}{page < pages && <Link href={href(page + 1)}>Sau →</Link>}</nav>
  </main>;
}
