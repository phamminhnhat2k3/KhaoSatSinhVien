import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
export async function resultActor() {
  const user = await requireUser();
  if (!user.roles.some(r => ["ADMIN", "DEAN", "LECTURER"].includes(r))) redirect("/unauthorized");
  const lecturer = await db.lecturerProfile.findUnique({ where: { userId: user.id } });
  return { ...user, facultyId: lecturer?.facultyId, lecturerId: lecturer?.id };
}
