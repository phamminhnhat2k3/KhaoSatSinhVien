import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { JWT } from "next-auth/jwt";
export function credentialVersion(passwordHash: string) { return createHash("sha256").update(passwordHash).digest("hex"); }
export async function validateCredentialToken(db: Pick<PrismaClient,"user">, token: JWT) {
  if (!token.id || !token.credentialVersion) return null;
  const user = await db.user.findUnique({ where: { id: token.id }, select: { active: true, passwordHash: true } });
  return user?.active && token.credentialVersion === credentialVersion(user.passwordHash) ? token : null;
}
