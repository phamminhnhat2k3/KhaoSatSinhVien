import Link from "next/link";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { questionTypes } from "@/modules/templates/rules";

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const user = await requireUser(Role.ADMIN);
  const templates = await db.surveyTemplate.findMany({ include: { questions: { orderBy: { position: "asc" }, include: { options: { orderBy: { position: "asc" } } } }, _count: { select: { campaigns: true } } }, orderBy: { createdAt: "desc" } });
  return <AppShell name={user.name} role="Quản trị viên" wide><Link className="text-button" href="/admin">← Trung tâm điều hành</Link><div className="section-heading"><div><p className="eyebrow">Kho nội dung</p><h1>Thư viện mẫu khảo sát</h1></div><Link className="button" href="/admin/templates/new">＋ Tạo mẫu</Link></div><p className="lead">Mẫu đã lưu được giữ nguyên để bảo toàn câu trả lời. Chọn “Tạo bản sao” khi cần điều chỉnh.</p>{(await searchParams).saved && <p className="notice" role="status">Đã lưu mẫu khảo sát thành công.</p>}<div className="stack">{!templates.length && <div className="card empty-state">Chưa có mẫu. Tạo mẫu đầu tiên để bắt đầu.</div>}{templates.map(t => <article className="card" key={t.id}><div className="section-heading"><div><h2>{t.title}</h2><p className="muted">{t.questions.length} câu hỏi · Được dùng trong {t._count.campaigns} đợt · {t.createdAt.toLocaleDateString("vi-VN")}</p></div><Link className="button secondary" href={`/admin/templates/new?copy=${t.id}`}>Tạo bản sao</Link></div><details><summary className="text-button">Xem nội dung câu hỏi</summary>{t.questions.map((q, i) => <section className="question" key={q.id}><strong>{i + 1}. {q.content}</strong><p className="muted">{questionTypes[q.type]} · {q.required ? "Bắt buộc" : "Không bắt buộc"}{q.type === "SCALE" && ` · ${q.scaleMin}–${q.scaleMax}, bước ${q.scaleStep}`}</p>{q.options.map(o => <p key={o.id}>• {o.label}</p>)}</section>)}</details></article>)}</div></AppShell>;
}
