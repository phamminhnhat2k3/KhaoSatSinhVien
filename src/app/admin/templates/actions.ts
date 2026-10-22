"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/access";
import { templateSchema } from "@/modules/templates/rules";
import { saveTemplate } from "@/modules/templates/service";

export async function createTemplate(_: string | undefined, form: FormData) {
  const user = await requireUser(Role.ADMIN);
  let input: unknown;
  try { input = JSON.parse(String(form.get("template"))); } catch { return "Không thể đọc nội dung mẫu khảo sát."; }
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) return parsed.error.issues.map(i => i.message).join(" ");
  try { await saveTemplate(user.id, parsed.data); } catch { return "Chưa lưu được mẫu. Nội dung vẫn được giữ trên màn hình, vui lòng thử lại."; }
  revalidatePath("/admin");
  revalidatePath("/admin/templates");
  redirect("/admin/templates?saved=1");
}
