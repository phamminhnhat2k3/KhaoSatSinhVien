import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/auth";

export async function requireUser(role?: Role) {
  const session = await auth();
  if (!session?.user || (role && !session.user.roles.includes(role))) redirect(role ? "/unauthorized" : "/login");
  return session.user;
}
