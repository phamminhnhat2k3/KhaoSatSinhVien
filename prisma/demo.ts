import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { hash, verify } from "argon2";
import { demoAccounts, demoFaculties, demoSubjectIndexes } from "./demo-data";

const db = new PrismaClient();
const file = resolve("TAI_KHOAN_MAU.md");
const facultyId = (code: string) => `demo26-faculty-${code}`;
const courseId = (code: string, i: number) => `demo26-course-${code}-${i + 1}`;
const classId = (code: string, i: number) => `demo26-class-${code}-${i + 1}`;
const homeId = (code: string, i: number) => `demo26-home-${code}-${i + 1}`;
const semesterId = "demo26-semester-hk1";

async function main() {
  const ids = demoAccounts.map(a => a.id);
  const existing = await db.user.findMany({ where: { id: { in: ids } }, select: { id: true } });
  assert(existing.length === 0 || existing.length === 70, "Bộ mẫu đã bị thay đổi một phần. Dừng để tránh ghi đè.");
  assert(existing.length === 0 || existsSync(file), "Đã có tài khoản mẫu nhưng thiếu file mật khẩu. Không đặt lại mật khẩu.");
  const passwords = new Map<string, string>();
  if (existsSync(file)) {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const cells = line.split("|").map(s => s.trim());
      if (cells.length === 8 && cells[4].startsWith("demo.")) passwords.set(cells[4], cells[5]);
    }
    assert(demoAccounts.every(a => (passwords.get(a.email)?.length ?? 0) >= 16), "File tài khoản không đầy đủ; giữ nguyên dữ liệu và file hiện có.");
  } else {
    for (const a of demoAccounts) passwords.set(a.email, `Demo!${randomBytes(12).toString("base64url")}`);
    let content = "# Tài khoản dữ liệu mẫu\n\nĐăng nhập: http://localhost:3000/login\n\n70 tài khoản mẫu: 5 Trưởng khoa kiêm giảng viên, 15 giảng viên thường và 50 sinh viên. Tất cả tên và tài khoản trong bộ này là dữ liệu giả lập. Email dùng để đăng nhập, không gửi thư.\n\nTài khoản quản trị viên và tài khoản cũ được giữ nguyên; file này chỉ ghi tài khoản mới của bộ mẫu, không đặt lại mật khẩu cũ.\n\nMật khẩu dưới đây được lưu rõ theo yêu cầu để thử đăng nhập; trong database chỉ lưu bản băm. Không chia sẻ file này lên Git hoặc dùng các tài khoản mẫu cho môi trường thật.\n\n";
    for (const f of demoFaculties) {
      content += `## Khoa ${f.name}\n\nMã khoa: DEMO-${f.code}. Hai lớp hành chính, mỗi lớp 5 sinh viên. Mỗi sinh viên được ghi danh 5 môn trong học kỳ mẫu.\n\n| Mã | Họ tên | Vai trò | Email đăng nhập | Mật khẩu | Khoa |\n|---|---|---|---|---|---|\n`;
      for (const a of demoAccounts.filter(a => a.facultyCode === f.code)) content += `| ${a.code} | ${a.name} | ${a.dean ? "Trưởng khoa + Giảng viên" : a.kind === "lecturer" ? "Giảng viên" : "Sinh viên"} | ${a.email} | ${passwords.get(a.email)} | ${f.name} |\n`;
      content += "\nCác môn học:\n\n" + f.subjects.map((s, i) => `- DEMO-${f.code}-${String(i + 1).padStart(2, "0")}: ${s}`).join("\n") + "\n\n";
    }
    writeFileSync(file, content, { encoding: "utf8", flag: "wx" });
  }

  // Stop on collisions; never overwrite an existing account or reset its password.
  if (!existing.length) {
    const hashes = new Map<string, string>();
    for (const a of demoAccounts) hashes.set(a.id, await hash(passwords.get(a.email)!));
    const before = await db.user.findMany({ where: { id: { notIn: ids } }, select: { id: true, passwordHash: true, email: true } });
    await db.$transaction(async tx => {
      await tx.semester.create({ data: { id: semesterId, name: "Học kỳ 1 · 2026–2027 (dữ liệu mẫu)", startsAt: new Date("2026-08-01"), endsAt: new Date("2027-01-31") } });
      for (const f of demoFaculties) {
        await tx.faculty.create({ data: { id: facultyId(f.code), code: `DEMO-${f.code}`, name: f.name } });
        for (let i = 0; i < 2; i++) await tx.academicClass.create({ data: { id: homeId(f.code, i), code: `DEMO-${f.code}-26${i + 1}`, name: `${f.code} khóa 2026 lớp ${i + 1} (mẫu)`, facultyId: facultyId(f.code) } });
        for (const a of demoAccounts.filter(a => a.facultyCode === f.code && a.kind === "lecturer")) {
          await tx.user.create({ data: { id: a.id, email: a.email, name: a.name, passwordHash: hashes.get(a.id)!, department: f.name, roles: { create: a.dean ? [{ role: "LECTURER" }, { role: "DEAN" }] : [{ role: "LECTURER" }] }, lecturer: { create: { id: a.profileId, lecturerCode: a.code, facultyId: facultyId(f.code) } } } });
        }
        const teachers = demoAccounts.filter(a => a.facultyCode === f.code && a.kind === "lecturer");
        for (const [i, name] of f.subjects.entries()) {
          await tx.course.create({ data: { id: courseId(f.code, i), code: `DEMO-${f.code}-${String(i + 1).padStart(2, "0")}`, name, facultyId: facultyId(f.code), lecturers: { connect: { id: teachers[i % 4].profileId } } } });
          await tx.courseClass.create({ data: { id: classId(f.code, i), code: `DEMO-${f.code}-${String(i + 1).padStart(2, "0")}.01`, courseId: courseId(f.code, i), semesterId, educationSystem: ["REGULAR", "PART_TIME", "DISTANCE"][i % 3], capacity: 40 } });
        }
        for (const a of demoAccounts.filter(a => a.facultyCode === f.code && a.kind === "student")) {
          await tx.user.create({ data: { id: a.id, email: a.email, name: a.name, passwordHash: hashes.get(a.id)!, department: f.name, roles: { create: { role: "STUDENT" } }, student: { create: { id: a.profileId, studentCode: a.code, academicClassId: homeId(f.code, Math.floor(a.index / 5)) } } } });
          await tx.enrollment.createMany({ data: demoSubjectIndexes(a.index).map(i => ({ classId: classId(f.code, i), studentId: a.profileId })) });
        }
      }
    }, { timeout: 60000 });
    const after = await db.user.findMany({ where: { id: { notIn: ids } }, select: { id: true, passwordHash: true, email: true } });
    assert.deepEqual(new Map(after.map(u => [u.id, [u.email, u.passwordHash]])), new Map(before.map(u => [u.id, [u.email, u.passwordHash]])), "Tài khoản cũ phải được giữ nguyên.");
  }
  const users = await db.user.findMany({ where: { id: { in: ids } }, include: { roles: true, lecturer: { include: { courses: true } }, student: { include: { academicClass: true, enrollments: true } } } });
  assert.equal(users.length, 70);
  for (const a of demoAccounts) {
    const u = users.find(u => u.id === a.id)!;
    assert.equal(u.email, a.email);
    assert(u.active && await verify(u.passwordHash, passwords.get(a.email)!), `Mật khẩu hoặc trạng thái không khớp cho ${a.code}; không đặt lại.`);
    assert.deepEqual(u.roles.map(r => r.role).sort(), (a.dean ? ["LECTURER", "DEAN"] : [a.kind === "lecturer" ? "LECTURER" : "STUDENT"]).sort());
    if (a.kind === "lecturer") { assert.equal(u.lecturer?.facultyId, facultyId(a.facultyCode)); assert(u.lecturer.courses.length >= 2); }
    else { assert.equal(u.student?.academicClass?.facultyId, facultyId(a.facultyCode)); assert.deepEqual(u.student!.enrollments.map(e => e.classId).sort(), demoSubjectIndexes(a.index).map(i => classId(a.facultyCode, i)).sort()); }
  }
  for (const f of demoFaculties) assert.equal(await db.course.count({ where: { id: { in: f.subjects.map((_, i) => courseId(f.code, i)) }, facultyId: facultyId(f.code) } }), 10);
  assert.equal(await db.courseClass.count({ where: { id: { in: demoFaculties.flatMap(f => f.subjects.map((_, i) => classId(f.code, i))) }, lecturerId: null } }), 50);
  console.log(`${existing.length ? "Đã kiểm tra bộ mẫu hiện có, không tạo trùng" : "Đã thêm bộ mẫu"}: 5 khoa, 20 giảng viên (5 trưởng khoa), 50 sinh viên, 50 môn, 50 lớp học phần, 250 lượt ghi danh. Đã xác minh toàn bộ 70 mật khẩu và phạm vi khoa.`);
  console.log(`File đăng nhập: ${file}`);
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Không tạo được dữ liệu mẫu."); process.exitCode = 1; }).finally(() => db.$disconnect());
