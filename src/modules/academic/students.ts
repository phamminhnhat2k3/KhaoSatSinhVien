import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { normalizeAcademicCode } from "./rules";

export const studentSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(191), studentCode: z.string().trim().min(3).max(30).transform(normalizeAcademicCode), password: z.string().min(8).max(100), academicClassId: z.string().min(1), courseClassIds: z.array(z.string().min(1)).max(200).default([]) });

export function studentWhere(params: { q?: string; facultyId?: string; academicClassId?: string }): Prisma.StudentProfileWhereInput {
  const q = (params.q ?? "").trim().slice(0, 100);
  return { ...(q ? { OR: [{ studentCode: { contains: q } }, { user: { name: { contains: q } } }, { user: { email: { contains: q } } }] } : {}), ...(params.facultyId ? { academicClass: { facultyId: params.facultyId } } : {}), ...(params.academicClassId ? { academicClassId: params.academicClassId } : {}) };
}
