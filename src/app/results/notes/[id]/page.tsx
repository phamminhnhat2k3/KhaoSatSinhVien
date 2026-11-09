import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ComparisonTable, type ComparisonData } from "@/components/ComparisonTable";
import { ResultNoteForm } from "@/components/ResultNoteForm";
import { PrintButton } from "@/components/PrintButton";
import { db } from "@/lib/db";
import { resultActor } from "@/modules/reporting/result-actor";
import { resultRole } from "@/modules/reporting/comparison";
import { noteVisibility } from "@/modules/reporting/notes";
export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await resultActor(), { id } = await params;
  const note = await db.resultNote.findFirst({ where: { AND: [{ id }, noteVisibility(actor)] }, include: { author: { select: { name: true } } } });
  if (!note) notFound();
  const data = note.snapshot as unknown as ComparisonData & { capturedAt: string };
  return <AppShell name={actor.name} role={resultRole(actor) === "ADMIN" ? "Quản trị viên" : resultRole(actor) === "DEAN" ? "Trưởng khoa" : "Giảng viên"} wide compact><div className="print-hidden"><Link href="/results">← Danh sách báo cáo</Link></div><article className="result-print"><h1>{note.title}</h1><p>{note.status === "SENT" ? "Đã gửi" : "Bản nháp"} · Người lập: {note.author.name} · {new Date(note.sentAt ?? note.updatedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</p><p>{data.faculty} · {data.semester}</p><ComparisonTable data={data}/><section className="card"><h2>Nhận xét</h2><p style={{ whiteSpace: "pre-wrap" }}>{note.observation}</p><h2>Hướng cải thiện</h2><p style={{ whiteSpace: "pre-wrap" }}>{note.plan}</p><p className="muted">Số liệu căn cứ ghi nhận lúc {new Date(data.capturedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}. Không bao gồm danh tính sinh viên. Các ô chưa đủ ngưỡng được giữ ẩn.</p></section></article>{note.status === "SENT" && resultRole(actor) === "ADMIN" && <PrintButton/>}{note.status === "DRAFT" && note.authorId === actor.id && <ResultNoteForm campaignId={note.campaignId} courseId={note.courseId} lecturerIds={data.selected} referenceId={data.trend?.referenceId} initial={note}/>}</AppShell>;
}
