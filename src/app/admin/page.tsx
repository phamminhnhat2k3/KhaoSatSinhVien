import Link from "next/link";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import {campaignPhase,campaignPhaseLabels} from "@/modules/survey-campaign/rules";
import { CloseCampaignForm } from "@/components/CampaignForm";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ created?: string; status?: string }> }) {
  const user = await requireUser(Role.ADMIN);
  const [campaigns, users, templates] = await Promise.all([
    db.surveyCampaign.findMany({ include: { template: true, faculty: true, semester: true, _count: { select: { participations: true, submissions: true, targets: true } } }, orderBy: { createdAt: "desc" } }), db.user.count(), db.surveyTemplate.count()
  ]);
  const params = await searchParams;
  const now=new Date();
  const filter=params.status==="PUBLISHED"?"OPEN":["DRAFT","SCHEDULED","OPEN","EXPIRED","CLOSED","CANCELLED"].includes(params.status??"")?params.status:"";
  const visible = filter ? campaigns.filter(c => campaignPhase(c,now) === filter) : campaigns;
  const drafts = campaigns.filter(c => c.status === "DRAFT");
  const shortcuts = [
    ["/admin/users", "Tất cả người dùng", "Sinh viên, giảng viên và quyền truy cập", "01"],
    ["/admin/academic", "Khoa và học vụ", "Khoa, lớp hành chính và học kỳ", "02"],
    ["/admin/classes/new", "Lớp học phần", "Môn học, hệ đào tạo và ghi danh", "03"],
    ["/admin/templates/new", "Tạo mẫu khảo sát", "Soạn câu hỏi, thang điểm và xem trước", "04"],
    ["/admin/lecturers", "Giảng viên / Trưởng khoa", "Phân khoa, phân công môn và bổ nhiệm", "05"],
    ["/admin/students/new", "Thêm sinh viên", "Tạo tài khoản và phân lớp hành chính", "06"]
  ];
  return <AppShell name={user.name} role="Quản trị viên" wide>
    <div className="admin-welcome"><div><p className="eyebrow">Trung tâm điều hành</p><h1>Quản lý khảo sát</h1><p className="muted">Theo dõi hoạt động và xử lý công việc quản trị tại một nơi.</p></div><Link className="button" href="/admin/campaigns/new">Tạo đợt mới</Link></div>
    {params.created && <p className="notice" role="status">Đã tạo đợt ở trạng thái nháp. Kiểm tra trước khi công bố.</p>}
    <section className="admin-overview" aria-label="Tổng quan hệ thống">{[["Đợt đang mở", campaigns.filter(c => campaignPhase(c,now) === "OPEN").length],["Đợt nháp",drafts.length],["Người dùng",users],["Mẫu khảo sát",templates]].map(([label,value])=><article className="card" key={label}><span className="muted">{label}</span><div className="stat">{value}</div></article>)}</section>
    {drafts.length > 0 && <div className="admin-pending"><div><strong>{drafts.length} đợt nháp cần kiểm tra</strong><p className="muted">Xem phạm vi, người nhận và ý kiến Trưởng khoa trước khi công bố.</p></div><Link className="text-button" href="/admin?status=DRAFT">Xem đợt nháp →</Link></div>}
    <section className="admin-tools" aria-labelledby="admin-tools-title"><div className="section-heading"><h2 id="admin-tools-title">Quản lý và thiết lập</h2><span className="muted">Chọn nhóm công việc</span></div><div className="admin-shortcuts">{shortcuts.map(([href,title,desc,number])=><Link className="admin-shortcut" href={href} key={href} aria-label={title}><span className="admin-shortcut-icon" aria-hidden="true">{number}</span><div><h3>{title}</h3><p className="muted">{desc}</p></div><span aria-hidden="true">→</span></Link>)}</div></section>
    <div className="section-heading"><h2>Các đợt khảo sát</h2><Link className="text-button" href="/admin/templates">Thư viện mẫu →</Link></div>
    <nav className="admin-status-filters" aria-label="Lọc đợt khảo sát">{[["", "Tất cả"],["SCHEDULED","Chờ bắt đầu"],["OPEN","Đang mở"],["EXPIRED","Hết hạn"],["DRAFT","Bản nháp"],["CLOSED","Đã đóng"],["CANCELLED","Đã hủy"]].map(([value,label])=><Link key={value} className={`button ${filter === value ? "" : "secondary"}`} href={value ? `/admin?status=${value}` : "/admin"} aria-current={filter === value ? "page" : undefined}>{label} ({value ? campaigns.filter(c=>campaignPhase(c,now)===value).length : campaigns.length})</Link>)}</nav>
    <article className="card admin-campaign-list">{!visible.length ? <p className="muted">Chưa có đợt khảo sát trong danh sách này. Chọn bộ lọc khác hoặc tạo đợt mới.</p> : <div className="stack">{visible.map(c => <section className="question" key={c.id}>
      <div className="section-heading"><div><h3><Link className="text-button" href={`/admin/campaigns/${c.id}/responses`}>{c.title}</Link></h3><p className="muted">{c.scope === "UNIVERSITY" ? "Toàn trường" : c.scope === "FACULTY" ? c.faculty?.name : `${c._count.targets} lớp học phần (đợt cũ)`} · {c.semester?.name ?? "Chưa phân học kỳ"} · {c._count.submissions}/{c._count.participations} phản hồi</p><small className="muted">{c.startsAt.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} – {c.endsAt.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</small></div><span className="pill">{{ DRAFT: "Bản nháp", PUBLISHED: "Đã công bố", CLOSED: "Đã đóng", CANCELLED: "Đã hủy" }[c.status]}</span>{c.status==="PUBLISHED"&&<span className="pill">{campaignPhaseLabels[campaignPhase(c,now)]}</span>}</div>
      <div className="actions"><Link className="button" href={`/admin/campaigns/${c.id}/report`}>Tiến độ / Tổng hợp kết quả</Link><Link className="button secondary" href={`/admin/campaigns/${c.id}/responses`}>Xem bài đánh giá ({c._count.submissions})</Link>{c.scope!=="LEGACY_CLASS"&&<Link className="button secondary" href={`/admin/campaigns/new?copy=${c.id}`}>Tạo bản sao đợt</Link>}{c.status === "DRAFT"&&c.scope!=="LEGACY_CLASS"&&<Link className="button secondary" href={`/admin/campaigns/new?edit=${c.id}`}>Sửa đợt nháp</Link>}{c.status === "DRAFT" && <Link className="button" href={`/admin/campaigns/${c.id}/review`}>Xem và công bố</Link>}{c.status === "PUBLISHED" && <CloseCampaignForm id={c.id}/>}</div>
    </section>)}</div>}</article>
  </AppShell>;
}
