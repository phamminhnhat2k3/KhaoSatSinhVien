import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ImportForm } from "@/components/ImportForm";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
export default async function ImportPage() {
  const actor = await requireUser("ADMIN");
  const [faculties, classes, terms] = await Promise.all([db.faculty.findMany({ orderBy: { code: "asc" } }), db.academicClass.findMany({ include: { faculty: true }, orderBy: { code: "asc" } }), db.semester.findMany({ orderBy: { startsAt: "desc" } })]);
  return <AppShell name={actor.name} role="Quản trị viên" wide compact><Link href="/admin/users">← Tất cả người dùng</Link><h1>Nhập dữ liệu hàng loạt</h1><p className="lead">Dùng Excel điền tệp mẫu, lưu dưới dạng CSV UTF-8 rồi tải lên. Tối đa 200 dòng mỗi lần. Kiểm tra và xem trước không ghi dữ liệu, chỉ nhập khi tất cả dòng hợp lệ.</p><ImportForm/><details className="card"><summary>Tra mã khoa, lớp và tên học kỳ đang có</summary><h3>Khoa</h3>{faculties.map(f => <p key={f.id}>{f.code} · {f.name}</p>)}<h3>Lớp hành chính</h3>{classes.map(c => <p key={c.id}>{c.code} · {c.name} · {c.faculty.name}</p>)}<h3>Tên học kỳ (chép đúng tên)</h3>{terms.map(t => <p key={t.id}>{t.name}</p>)}<Link href="/admin/assignments">Tra mã lớp học phần và phân công →</Link></details></AppShell>;
}
