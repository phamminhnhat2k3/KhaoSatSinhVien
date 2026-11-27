import { z } from "zod";
import { hash } from "argon2";
import type { Prisma, PrismaClient } from "@prisma/client";
import { normalizeAcademicCode } from "./rules";
import { parseImportCsv, type ImportKind } from "./import-csv";
import { saveClassStudyPlan, validateGroups } from "./study-plan";

const person = z.object({ name: z.string().trim().min(2).max(100), email: z.email().max(191).transform(s => s.toLowerCase()) });
const code = z.string().min(2).max(30).transform(normalizeAcademicCode);
const student = person.extend({ studentCode: code, academicClassCode: code });
const lecturer = person.extend({ lecturerCode: code, facultyCode: code, dean: z.enum(["yes", "no"]) });
type PreparedRow = { line: number; values: string[]; data: Record<string, string>; error: string; resolved?: string };
export async function previewImport(tx: Prisma.TransactionClient, kind: ImportKind, raw: string) {
  const rows: PreparedRow[] = parseImportCsv(raw, kind), seenEmail = new Set<string>(), seenCode = new Set<string>();
  const groups = new Map<string, { academicClassId: string; semesterId: string; classIds: string[]; lines: number[]; facultyId: string; educationSystem: string }>();
  for (const row of rows) {
    if (row.error) continue;
    try {
      if (kind === "students" || kind === "lecturers") {
        const parsed = (kind === "students" ? student : lecturer).parse(row.data);
        const data = parsed as Record<string, string>, key = kind === "students" ? data.studentCode : data.lecturerCode;
        if (seenEmail.has(data.email) || seenCode.has(key)) throw new Error("Email hoặc mã bị lặp trong tệp.");
        seenEmail.add(data.email); seenCode.add(key);
        if (await tx.user.count({ where: { email: data.email } }) || (kind === "students" ? await tx.studentProfile.count({ where: { studentCode: key } }) : await tx.lecturerProfile.count({ where: { lecturerCode: key } }))) throw new Error("Email hoặc mã đã tồn tại. Không ghi đè tài khoản cũ.");
        const target = kind === "students" ? await tx.academicClass.findUnique({ where: { code: data.academicClassCode } }) : await tx.faculty.findUnique({ where: { code: data.facultyCode } });
        if (!target) throw new Error(kind === "students" ? "Mã lớp hành chính chưa tồn tại." : "Mã khoa chưa tồn tại.");
        row.resolved = target.id; row.data = data;
      } else {
        const data = z.object({ semesterName: z.string().min(1).max(200), academicClassCode: code, courseClassCode: z.string().min(2).max(60).transform(normalizeAcademicCode) }).parse(row.data);
        const group = await tx.academicClass.findUnique({ where: { code: data.academicClassCode } });
        const cls = await tx.courseClass.findUnique({ where: { code: data.courseClassCode }, include: { semester: true } });
        if (!group || !cls) throw new Error("Mã lớp hành chính hoặc lớp học phần chưa tồn tại.");
        if (cls.semester.name !== data.semesterName) throw new Error(`Lớp học phần ${cls.code} thuộc ${cls.semester.name}. Kiểm tra lại học kỳ trong tệp.`);
        const key = `${group.id}:${cls.semesterId}`;
        const plan = groups.get(key) ?? { academicClassId: group.id, semesterId: cls.semesterId, classIds: [], lines: [], facultyId: group.facultyId, educationSystem: group.educationSystem };
        if (plan.classIds.includes(cls.id)) throw new Error("Lớp học phần bị lặp trong cùng phân công.");
        plan.classIds.push(cls.id); plan.lines.push(row.line); groups.set(key, plan);
      }
    } catch (e) { row.error = e instanceof z.ZodError ? "Sai định dạng tên, email, mã hoặc quyền trưởng khoa (yes/no)." : e instanceof Error ? e.message : "Dữ liệu không hợp lệ."; }
  }
  for (const plan of groups.values()) try { await validateGroups(tx, plan.semesterId, plan.classIds, plan.facultyId, plan.educationSystem, plan.academicClassId); } catch (e) { for (const line of plan.lines) rows.find(r => r.line === line)!.error = e instanceof Error ? e.message : "Phân công không hợp lệ."; }
  return { rows, groups: [...groups.values()], valid: rows.every(r => !r.error) };
}
export async function commitImport(db: PrismaClient, actorId: string, kind: ImportKind, raw: string, password: string) {
  if (kind !== "assignments" && (password.length < 8 || password.length > 100)) throw new Error("Mật khẩu khởi tạo phải từ 8 đến 100 ký tự.");
  const passwordHash = kind !== "assignments" ? await hash(password) : "";
  return db.$transaction(async tx => {
    const preview = await previewImport(tx, kind, raw);
    if (!preview.valid) return preview;
    if (kind === "assignments") for (const plan of preview.groups) await saveClassStudyPlan(tx, actorId, plan);
    else for (const row of preview.rows) {
      const d = row.data;
      await tx.user.create({ data: { name: d.name, email: d.email, passwordHash, roles: { create: kind === "students" ? [{ role: "STUDENT" }] : [{ role: "LECTURER" }, ...(d.dean === "yes" ? [{ role: "DEAN" as const }] : [])] }, ...(kind === "students" ? { student: { create: { studentCode: d.studentCode, academicClassId: row.resolved! } } } : { lecturer: { create: { lecturerCode: d.lecturerCode, facultyId: row.resolved! } } }) } });
    }
    await tx.auditLog.create({ data: { actorId, action: `IMPORT_${kind.toUpperCase()}`, entity: "ImportBatch", entityId: `${kind}:${preview.rows.length}` } });
    return preview;
  }, { isolationLevel: "Serializable", timeout: 60000 });
}
