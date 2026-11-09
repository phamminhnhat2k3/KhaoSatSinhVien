import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function currentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, email: true, active: true, roles: true } });
  return user?.active ? { id: user.id, name: user.name, email: user.email, roles: user.roles.map(r => r.role) } : null;
}

export async function requireUser(role?: Role) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (role && !user.roles.includes(role) && !(role === "DEAN" && user.roles.includes("ADMIN"))) redirect("/unauthorized");
  return user;
}
