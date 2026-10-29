import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getCampaignReport } from "./service";
export async function actorReport(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Không có quyền truy cập.");
  const user = await db.user.findUnique({ where: { id: session.user.id }, include: { roles: true, lecturer: true } });
  if (!user?.active) throw new Error("Không có quyền truy cập.");
  const roles = user.roles.map(r => r.role);
  if (roles.includes("ADMIN")) return getCampaignReport(db, id);
  if (roles.includes("DEAN")) {
    if (!user.lecturer?.facultyId) throw new Error("Trưởng khoa chưa được phân khoa.");
    return getCampaignReport(db, id, undefined, user.lecturer.facultyId);
  }
  if (roles.includes("LECTURER") && user.lecturer) return getCampaignReport(db, id, user.lecturer.id);
  throw new Error("Không có quyền truy cập.");
}
