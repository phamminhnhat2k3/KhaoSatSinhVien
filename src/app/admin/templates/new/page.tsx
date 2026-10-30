import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { TemplateForm } from "@/components/TemplateForm";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import {templateDraftKey} from "@/modules/templates/draft";

export default async function NewTemplatePage({ searchParams }: { searchParams: Promise<{ copy?: string;edit?:string }> }) {
  const user = await requireUser(Role.ADMIN);
  const {copy,edit}=await searchParams;
  if(copy&&edit)notFound();
  const sourceId=edit??copy;
  const source = sourceId ? await db.surveyTemplate.findUnique({ where: { id: sourceId }, include: {_count:{select:{campaigns:true,courseCampaigns:true}}, questions: { orderBy: { position: "asc" }, include: { options: { orderBy: { position: "asc" } } } } } }) : null;
  if (sourceId && !source) notFound();
  const editing=edit&&source?{id:source.id,version:source.version,used:source._count.campaigns+source._count.courseCampaigns>0}:undefined;
  const draftSource=editing?`edit:${editing.id}:v${editing.version}`:copy;
  return <AppShell name={user.name} role="Quản trị viên" wide focused><p className="eyebrow">Thiết kế khảo sát</p><h1>{edit?"Chỉnh sửa mẫu khảo sát":source ? "Tạo bản sao và chỉnh sửa" : "Tạo mẫu khảo sát"}</h1><p className="lead">Nháp tự lưu trên trình duyệt này. Bấm “Lưu mẫu khảo sát” để đưa mẫu hoàn chỉnh vào thư viện.</p>{editing&&<p className="notice">{editing.used?"Mẫu đã được dùng trong đợt khảo sát. Lưu sẽ tạo phiên bản mới; các đợt hiện có tiếp tục dùng mẫu cũ.":"Mẫu chưa sử dụng: bạn có thể cập nhật trực tiếp. Thay đổi chỉ có hiệu lực sau khi bấm Lưu thay đổi."}</p>}<TemplateForm edit={editing} key={draftSource??"new"} draftKey={templateDraftKey(user.id,draftSource)} initial={source ? { title: source.title, questions: source.questions } : undefined}/></AppShell>;
}
