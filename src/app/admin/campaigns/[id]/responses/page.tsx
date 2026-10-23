import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";

export default async function ResponsesPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser(Role.ADMIN);
  const { id } = await params;
  const page = Math.max(1, Math.min(10000, Number.parseInt((await searchParams).page ?? "1", 10) || 1));
  const campaign = await db.surveyCampaign.findUnique({ where: { id }, select: { title: true, _count: { select: { submissions: true } } } });
  if (!campaign) notFound();
  const submissions = await db.submission.findMany({ where: { campaignId: id }, select: { id: true, submittedAt: true }, orderBy: [{ submittedAt: "asc" }, { id: "asc" }], take: 20, skip: (page - 1) * 20 });
  return <AppShell name={user.name} role="Quản trị viên" wide>
    <Link className="text-button" href="/admin">← Quản lý khảo sát</Link>
    <p className="eyebrow">Phiếu đánh giá đã gửi</p><h1>{campaign.title}</h1>
    <p className="lead">{campaign._count.submissions} phiếu đã nộp. Chọn một phiếu để xem từng câu trả lời.</p>
    <p className="notice">Phiếu được lưu tách khỏi danh tính. Hệ thống không hiển thị tên hoặc mã sinh viên của người gửi.</p>
    <div className="stack">{submissions.map((s, i) => <Link className="card workspace-link" key={s.id} href={`/admin/campaigns/${id}/responses/${s.id}`}><h2>Phiếu {(page - 1) * 20 + i + 1}</h2><p className="muted">Đã gửi lúc {s.submittedAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</p><span className="text-button">Xem bài đánh giá →</span></Link>)}{!submissions.length && <section className="card empty-state"><h2>Chưa có phiếu đánh giá</h2><p className="muted">Các phiếu sẽ xuất hiện sau khi sinh viên gửi phản hồi.</p></section>}</div>
    <nav className="section-heading" aria-label="Phân trang phiếu đánh giá">{page > 1 && <Link className="text-button" href={`?page=${page - 1}`}>← Trang trước</Link>}<span className="muted">Trang {page}</span>{page * 20 < campaign._count.submissions && <Link className="text-button" href={`?page=${page + 1}`}>Trang sau →</Link>}</nav>
  </AppShell>;
}
