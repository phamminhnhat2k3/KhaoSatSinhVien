import { Role } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const schema = z.object({ title: z.string().trim().min(3), questions: z.array(z.object({ content: z.string().trim().min(3), type: z.enum(["SINGLE", "MULTIPLE", "SCALE", "TEXT"]), required: z.boolean().default(true), options: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).default([]) })).min(1) });

export async function GET() {
  const session = await auth();
  if (!session?.user.roles.includes(Role.ADMIN)) return Response.json({ code: "FORBIDDEN", message: "Không có quyền truy cập." }, { status: 403 });
  return Response.json(await db.surveyTemplate.findMany({ include: { questions: { include: { options: true } } }, orderBy: { createdAt: "desc" } }));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user.roles.includes(Role.ADMIN)) return Response.json({ code: "FORBIDDEN", message: "Không có quyền truy cập." }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ code: "INVALID_INPUT", message: "Mẫu khảo sát không hợp lệ." }, { status: 400 });
  const template = await db.surveyTemplate.create({ data: { title: parsed.data.title, questions: { create: parsed.data.questions.map((question, position) => ({ content: question.content, type: question.type, required: question.required, position: position + 1, options: { create: question.options.map((option, optionPosition) => ({ ...option, position: optionPosition + 1 })) } })) } } });
  await db.auditLog.create({ data: { actorId: session.user.id, action: "CREATE", entity: "SurveyTemplate", entityId: template.id } });
  return Response.json(template, { status: 201 });
}
