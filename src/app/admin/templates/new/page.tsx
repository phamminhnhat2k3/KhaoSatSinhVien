import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { TemplateForm } from "@/components/TemplateForm";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";

export default async function NewTemplatePage({ searchParams }: { searchParams: Promise<{ copy?: string }> }) {
  const user = await requireUser(Role.ADMIN);
  const { copy } = await searchParams;
  const source = copy ? await db.surveyTemplate.findUnique({ where: { id: copy }, include: { questions: { orderBy: { position: "asc" }, include: { options: { orderBy: { position: "asc" } } } } } }) : null;
  if (copy && !source) notFound();
  return <AppShell name={user.name} role="Quản trị viên" wide><Link className="text-button" href="/admin/templates">← Thư viện mẫu</Link><p className="eyebrow">Thiết kế khảo sát</p><h1>{source ? "Tạo bản sao và chỉnh sửa" : "Tạo mẫu khảo sát"}</h1><p className="lead">Xây dựng từng câu hỏi theo mục tiêu của bạn. Nội dung hiện tại chỉ được lưu khi bạn bấm lưu mẫu.</p><TemplateForm initial={source ? { title: source.title, questions: source.questions } : undefined}/></AppShell>;
}
