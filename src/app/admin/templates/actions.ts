"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/access";
import { templateSchema } from "@/modules/templates/rules";
import { saveTemplate } from "@/modules/templates/service";
import {editTemplate,removeTemplate} from "@/modules/templates/manage";
import {db} from "@/lib/db";
import {redirect} from "next/navigation";

export async function createTemplate(_: string | undefined, form: FormData) {
  const user = await requireUser(Role.ADMIN);
  let input: unknown;
  try { input = JSON.parse(String(form.get("template"))); } catch { return "Không thể đọc nội dung mẫu khảo sát."; }
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) return parsed.error.issues.map(i => i.message).join(" ");
  try { await saveTemplate(user.id, parsed.data); } catch { return "Chưa lưu được mẫu. Nội dung vẫn được giữ trên màn hình, vui lòng thử lại."; }
  revalidatePath("/admin");
  revalidatePath("/admin/templates");
  return {saved:true} as const;
}
export async function updateTemplate(_:string|undefined,form:FormData){
  const user=await requireUser(Role.ADMIN);
  const id=String(form.get("id")??""),version=Number(form.get("version"));
  if(!id||!Number.isInteger(version)||version<1)return "Thông tin phiên bản không hợp lệ. Tải lại trang và thử lại.";
  let input:unknown;
  try{input=JSON.parse(String(form.get("template")));}catch{return "Không đọc được nội dung mẫu khảo sát.";}
  const parsed=templateSchema.safeParse(input);if(!parsed.success)return parsed.error.issues.map(i=>i.message).join(" ");
  try{
    const result=await editTemplate(db,user.id,id,version,parsed.data);
    revalidatePath("/admin/templates");revalidatePath("/admin");revalidatePath("/admin/campaigns/new");
    return {saved:true,versioned:result.versioned} as const;
  }catch(error){return error instanceof Error&&error.message.startsWith("Mẫu đã được cập nhật")?error.message:"Chưa cập nhật được mẫu. Nội dung và bản nháp được giữ lại; hãy tải lại thư viện để kiểm tra.";}
}
export async function deleteTemplate(_:string|undefined,form:FormData){
  const user=await requireUser(Role.ADMIN);
  const id=String(form.get("id")??""),version=Number(form.get("version"));
  if(!id||!Number.isInteger(version)||version<1||form.get("confirm")!=="yes")return "Thông tin xóa mẫu không hợp lệ.";
  try{await removeTemplate(db,user.id,id,version);}
  catch(error){revalidatePath("/admin/templates");return error instanceof Error&&["Không thể xóa mẫu","Mẫu đã được cập nhật"].some(p=>error.message.startsWith(p))?error.message:"Không thể xóa mẫu. Mẫu có thể đã được sử dụng hoặc vừa được thay đổi; vui lòng tải lại.";}
  revalidatePath("/admin/templates");revalidatePath("/admin");revalidatePath("/admin/campaigns/new");
  redirect("/admin/templates?deleted=1");
}
