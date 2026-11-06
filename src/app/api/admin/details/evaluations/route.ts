import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getEntityEvaluations } from "@/modules/reporting/entity-evaluations";
import { entityReadAccess } from "@/modules/academic/entity-access";

export async function GET(request: Request) {
  const session = await auth();
  const actor = session?.user?.id ? await db.user.findUnique({ where: { id: session.user.id }, select: { active: true, roles: true, lecturer: { select: { facultyId: true } } } }) : null;
  const access = entityReadAccess(actor);
  if (!access) return Response.json({}, { status: 403 });
  const params = new URL(request.url).searchParams;
  const type = params.get("type") ?? "", id = params.get("id") ?? "", page = Number(params.get("page") ?? 1);
  if (!["user", "faculty", "course"].includes(type) || !id || !Number.isSafeInteger(page) || page < 1) return Response.json({ error: "Tham số không hợp lệ." }, { status: 400 });
  try {
    const data = await getEntityEvaluations(db, type, id, page, params.get("campaignId") ?? undefined, access.facultyId);
    return Response.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error && /^(Không tìm thấy|Chưa có|Các môn|Cần tối thiểu|Báo cáo chỉ)/.test(error.message) ? error.message : "Không tải được đánh giá. Vui lòng thử lại.";
    return Response.json({ error: message }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  }
}
