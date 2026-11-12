import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verify } from "argon2";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { credentialVersion, validateCredentialToken } from "@/modules/profile/session";

const credentialsSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(100) });

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [Credentials({
    credentials: { email: {}, password: {} },
    authorize: async (raw) => {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) return null;
      const user = await db.user.findUnique({ where: { email: parsed.data.email }, include: { roles: true } });
      if (!user?.active || !(await verify(user.passwordHash, parsed.data.password))) return null;
      return { id: user.id, email: user.email, name: user.name, roles: user.roles.map(({ role }) => role), credentialVersion: credentialVersion(user.passwordHash) };
    }
  })],
  callbacks: {
    jwt: async ({ token, user }) => user ? { ...token, id: user.id!, roles: user.roles, credentialVersion: user.credentialVersion } : validateCredentialToken(db, token),
    session: ({ session, token }) => {
      session.user.id = token.id as string;
      session.user.roles = token.roles as Role[];
      return session;
    }
  }
});
