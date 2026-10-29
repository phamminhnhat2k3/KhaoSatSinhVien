import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function requireUser(role?: Role) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await db.user.findUnique({ where: { id: session.user.id }, include: { roles: true } });
  if (!user?.active) redirect("/login");
  const roles = user.roles.map(r => r.role);
  if (role && !roles.includes(role) && !(role === "DEAN" && roles.includes("ADMIN"))) redirect("/unauthorized");
  return { id: user.id, name: user.name, email: user.email, roles };
}
