import type { Prisma } from "@prisma/client";
import { z } from "zod";
export const userEditSchema = z.object({ id: z.string().min(1), name: z.string().trim().min(2).max(120), email: z.email().max(191).transform(v => v.toLowerCase()), phone: z.string().trim().max(30), studentCode: z.string().trim().max(30).default(""), academicClassId: z.string().default("") });
export function userWhere(p: { q?: string; role?: string; facultyId?: string; academicClassId?: string; active?: string }): Prisma.UserWhereInput {
  const q = p.q?.trim().slice(0,100);
  return { AND: [
    ...(q ? [{ OR: [{ name: { contains: q } }, { email: { contains: q } }, { student: { studentCode: { contains: q } } }, { lecturer: { lecturerCode: { contains: q } } }] }] : []),
    ...(["ADMIN","DEAN","LECTURER","STUDENT"].includes(p.role ?? "") ? [{ roles: { some: { role: p.role as "ADMIN" | "DEAN" | "LECTURER" | "STUDENT" } } }] : []),
    ...(p.facultyId ? [{ OR: [{ lecturer: { facultyId: p.facultyId } }, { student: { academicClass: { facultyId: p.facultyId } } }] }] : []),
    ...(p.academicClassId ? [{ student: { academicClassId: p.academicClassId } }] : []),
    ...(p.active === "true" || p.active === "false" ? [{ active: p.active === "true" }] : [])
  ] };
}
export function userRemovalIssue(actorId: string, target: { id: string; roles: { role: string }[]; auditLogs: number; participations: number; classes: number }) {
  if (target.id === actorId) return "Không thể xóa tài khoản đang đăng nhập.";
  if (target.roles.some(r => r.role === "ADMIN")) return "Không xóa tài khoản quản trị tại đây. Có thể khóa tài khoản quản trị khác nếu còn admin hoạt động.";
  if (target.auditLogs || target.participations || target.classes) return "Tài khoản có lịch sử khảo sát, nhật ký hoặc lớp cũ phụ trách nên không thể xóa. Hãy khóa tài khoản để giữ lịch sử.";
  return null;
}
