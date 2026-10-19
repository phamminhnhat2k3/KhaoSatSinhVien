import { Role } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { submitResponse } from "@/modules/response/service";

const schema = z.record(z.string(), z.union([z.string(), z.array(z.string())]));

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.roles.includes(Role.STUDENT)) return Response.json({ code: "FORBIDDEN", message: "Không có quyền truy cập." }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ code: "INVALID_INPUT", message: "Dữ liệu phản hồi không hợp lệ." }, { status: 400 });
  try {
    const student = await db.studentProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
    const submission = await submitResponse(db, (await params).id, student.id, parsed.data);
    return Response.json({ id: submission.id }, { status: 201 });
  } catch (error) { return Response.json({ code: "SUBMISSION_REJECTED", message: error instanceof Error ? error.message : "Không thể gửi phản hồi." }, { status: 400 }); }
}
