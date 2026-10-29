import Link from "next/link";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { closeCampaign } from "./actions";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const user = await requireUser(Role.ADMIN);
  const [campaigns, users, templates] = await Promise.all([
    db.surveyCampaign.findMany({ include: { template: true, faculty: true, semester: true, _count: { select: { participations: true, submissions: true, targets: true } } }, orderBy: { createdAt: "desc" } }), db.user.count(), db.surveyTemplate.count()
  ]);
  return <AppShell name={user.name} role="Quản trị viên" wide>
    <p className="eyebrow">Trung tâm điều hành</p><h1>Quản lý khảo sát</h1><p className="lead">Thiết kế câu hỏi, tổ chức đợt khảo sát và quản lý dữ liệu học vụ.</p>
    {(await searchParams).created && <p className="notice" role="status">Đã tạo đợt ở trạng thái nháp. Kiểm tra trước khi công bố.</p>}
    <section className="grid"><article className="card"><span className="muted">Người dùng</span><div className="stat">{users}</div></article><article className="card"><span className="muted">Mẫu khảo sát</span><div className="stat">{templates}</div></article><article className="card"><span className="muted">Đợt đang mở</span><div className="stat">{campaigns.filter(c => c.status === "PUBLISHED").length}</div></article></section>
    <div className="section-heading"><h2>Không gian làm việc</h2><Link className="button secondary" href="/admin/lecturers">Giảng viên / Trưởng khoa</Link><div className="actions"><Link className="button secondary" href="/admin/users">Tất cả người dùng</Link><Link className="button secondary" href="/admin/academic">Khoa / Lớp hành chính / Học kỳ</Link></div></div><div className="grid">{[
      ["/admin/templates/new", "01", "Tạo mẫu khảo sát", "Kéo thả câu hỏi, cấu hình thang điểm và xem trước."],
      ["/admin/campaigns/new", "02", "Tạo đợt mới", "Khảo sát theo khoa hoặc toàn trường trong học kỳ."],
      ["/admin/classes/new", "03", "Tạo học phần và lớp học phần", "Môn, khoa, học kỳ, hệ đào tạo và sĩ số."],
      ["/admin/students/new", "04", "Thêm sinh viên", "Phân khoa/lớp hành chính và đăng ký môn học riêng."]
    ].map(([href, number, title, desc]) => <Link className="card workspace-link" key={href} href={href}><span className="eyebrow">{number} / QUẢN TRỊ</span><h3>{title}</h3><p className="muted">{desc}</p><span className="text-button">Mở trang →</span></Link>)}</div>
    <div className="section-heading"><h2>Các đợt khảo sát</h2><Link className="text-button" href="/admin/templates">Thư viện mẫu →</Link></div>
    <article className="card">{!campaigns.length ? <p className="muted">Chưa có đợt khảo sát. Bắt đầu bằng việc tạo mẫu và chọn đối tượng tham gia.</p> : <div className="stack">{campaigns.map(c => <section className="question" key={c.id}>
      <div className="section-heading"><div><h3><Link className="text-button" href={`/admin/campaigns/${c.id}/responses`}>{c.title}</Link></h3><p className="muted">{c.scope === "UNIVERSITY" ? "Toàn trường" : c.scope === "FACULTY" ? c.faculty?.name : `${c._count.targets} lớp học phần (đợt cũ)`} · {c.semester?.name ?? "Chưa phân học kỳ"} · {c._count.submissions}/{c._count.participations} phản hồi</p><small className="muted">{c.startsAt.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} – {c.endsAt.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</small></div><span className="pill">{{ DRAFT: "Bản nháp", PUBLISHED: "Đã công bố", CLOSED: "Đã đóng", CANCELLED: "Đã hủy" }[c.status]}</span></div>
      <div className="actions"><Link className="button secondary" href={`/admin/campaigns/${c.id}/responses`}>Xem bài đánh giá ({c._count.submissions})</Link>{c.status === "DRAFT" && <Link className="button" href={`/admin/campaigns/${c.id}/review`}>Xem và công bố</Link>}{c.status === "PUBLISHED" && <form action={closeCampaign}><input type="hidden" name="id" value={c.id}/><button className="button danger">Đóng khảo sát</button></form>}</div>
    </section>)}</div>}</article>
  </AppShell>;
}
