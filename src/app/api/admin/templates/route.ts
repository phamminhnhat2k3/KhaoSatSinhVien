import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { templateSchema } from "@/modules/templates/rules";
import { saveTemplate } from "@/modules/templates/service";

export async function GET() {
  const session = await auth();
  if (!session?.user.roles.includes(Role.ADMIN)) return Response.json({ message: "Không có quyền truy cập." }, { status: 403 });
  return Response.json(await db.surveyTemplate.findMany({ include: { questions: { include: { options: { orderBy: { position: "asc" } } }, orderBy: { position: "asc" } } }, orderBy: { createdAt: "desc" } }));
}
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user.roles.includes(Role.ADMIN)) return Response.json({ message: "Không có quyền truy cập." }, { status: 403 });
  const parsed = templateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: parsed.error.issues[0].message }, { status: 400 });
  try { return Response.json(await saveTemplate(session.user.id, parsed.data), { status: 201 }); }
  catch { return Response.json({ message: "Không thể lưu mẫu khảo sát." }, { status: 500 }); }
}
