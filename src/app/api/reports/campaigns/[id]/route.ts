import { actorReport } from "@/modules/reporting/access";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    return Response.json(await actorReport((await params).id));
  } catch (error) { return Response.json({ code: "REPORT_UNAVAILABLE", message: error instanceof Error ? error.message : "Không thể mở báo cáo." }, { status: 400 }); }
}
