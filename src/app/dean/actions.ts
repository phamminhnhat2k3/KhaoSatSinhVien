"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/access";
import { canManageFaculty } from "@/modules/academic/permissions";
export async function reviewCampaign(_: string | undefined, form: FormData) {
  const user = await requireUser("DEAN");
  const own = await db.lecturerProfile.findUnique({ where: { userId: user.id } });
  const id = String(form.get("id") ?? "");
  if (!["approve", "changes"].includes(String(form.get("decision")))) return "Chọn quyết định xét duyệt.";
  const approved = form.get("decision") === "approve";
  const note = String(form.get("note") ?? "").trim().slice(0, 2000);
  try { await db.$transaction(async tx => {
    const campaign = await tx.surveyCampaign.findUniqueOrThrow({ where: { id } });
    if (campaign.status !== "DRAFT" || campaign.scope !== "FACULTY" || !canManageFaculty(user.roles, own?.facultyId, campaign.facultyId)) throw new Error("Không có quyền xét duyệt đợt này.");
    await tx.surveyCampaign.update({ where: { id, status: "DRAFT" }, data: { approvedAt: approved ? new Date() : null, approvedBy: approved ? user.id : null, reviewNote: note || (approved ? "Đồng ý công bố" : "Yêu cầu chỉnh sửa") } });
    await tx.auditLog.create({ data: { actorId: user.id, action: approved ? "APPROVE" : "REQUEST_CHANGES", entity: "SurveyCampaign", entityId: id } });
    const admins = await tx.user.findMany({ where: { active: true, roles: { some: { role: "ADMIN" } } }, select: { id: true } });
    await tx.notification.createMany({ data: admins.map(a => ({ userId: a.id, title: approved ? "Trưởng khoa đã duyệt khảo sát" : "Khảo sát cần chỉnh sửa", body: `${campaign.title}: ${note || "Xem trạng thái xét duyệt"}`, href: `/admin/campaigns/${id}/review` })) });
  });
  } catch { return "Không thể lưu. Kiểm tra quyền theo khoa và trạng thái đợt nháp."; }
  revalidatePath("/dean"); revalidatePath("/admin");
  return "Đã lưu xét duyệt.";
}
