import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session { user: { id: string; roles: Role[] } & DefaultSession["user"] }
  interface User { roles: Role[]; credentialVersion?: string }
}

declare module "next-auth/jwt" { interface JWT { id: string; roles: Role[]; credentialVersion?: string } }
