import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { TemplateForm } from "@/components/TemplateForm";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import {templateDraftKey} from "@/modules/templates/draft";

export default async function NewTemplatePage({ searchParams }: { searchParams: Promise<{ copy?: string }> }) {
  const user = await requireUser(Role.ADMIN);
  const { copy } = await searchParams;
  const source = copy ? await db.surveyTemplate.findUnique({ where: { id: copy }, include: { questions: { orderBy: { position: "asc" }, include: { options: { orderBy: { position: "asc" } } } } } }) : null;
  if (copy && !source) notFound();
  return <AppShell name={user.name} role="Quản trị viên" wide focused><p className="eyebrow">Thiết kế khảo sát</p><h1>{source ? "Tạo bản sao và chỉnh sửa" : "Tạo mẫu khảo sát"}</h1><p className="lead">Nháp tự lưu trên trình duyệt này. Bấm “Lưu mẫu khảo sát” để đưa mẫu hoàn chỉnh vào thư viện.</p><TemplateForm key={copy??"new"} draftKey={templateDraftKey(user.id,copy)} initial={source ? { title: source.title, questions: source.questions } : undefined}/></AppShell>;
}
