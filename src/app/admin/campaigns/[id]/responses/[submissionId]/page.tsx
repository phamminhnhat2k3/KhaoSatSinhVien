import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { questionTypes } from "@/modules/templates/rules";
import { displayAnswer } from "@/modules/reporting/answers";

export default async function SubmissionPage({ params }: { params: Promise<{ id: string; submissionId: string }> }) {
  const user = await requireUser(Role.ADMIN);
  const { id, submissionId } = await params;
  const submission = await db.submission.findFirst({ where: { id: submissionId, campaignId: id }, select: { submittedAt: true, answers: { select: { questionId: true, value: true } }, campaign: { select: { title: true, template: { select: { questions: { orderBy: { position: "asc" }, include: { options: { orderBy: { position: "asc" } } } } } } } } } });
  if (!submission) notFound();
  const answers = new Map(submission.answers.map(a => [a.questionId, a.value]));
  return <AppShell name={user.name} role="Quản trị viên" wide>
    <Link className="text-button" href={`/admin/campaigns/${id}/responses`}>← Danh sách phiếu đã gửi</Link>
    <p className="eyebrow">Chi tiết bài đánh giá</p><h1>{submission.campaign.title}</h1>
    <p className="muted">Đã gửi lúc {submission.submittedAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</p>
    <p className="notice">Phiếu ẩn danh · Chỉ hiển thị nội dung đã nộp.</p>
    <div className="stack">{submission.campaign.template.questions.map((q, i) => <article className="card" key={q.id}><span className="pill">{questionTypes[q.type]}</span><h2>{i + 1}. {q.content}</h2><div className="submitted-answer">{displayAnswer(q, answers.get(q.id))}</div></article>)}</div>
  </AppShell>;
}
