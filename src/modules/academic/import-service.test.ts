import { expect, test, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { commitImport, previewImport } from "./import-service";
function fixture() {
  const tx = { user: { count: vi.fn().mockResolvedValue(0), create: vi.fn() }, studentProfile: { count: vi.fn().mockResolvedValue(0) }, academicClass: { findUnique: vi.fn().mockImplementation(({ where }: { where: { code: string } }) => Promise.resolve(where.code === "LOP01" ? { id: "lop" } : null)) }, auditLog: { create: vi.fn() } };
  const db = { ...tx, $transaction: (callback: (client: typeof tx) => unknown) => callback(tx) } as unknown as PrismaClient;
  return { tx, db };
}
test("xem trước không ghi, có dòng lỗi thì xác nhận cũng không nhập một phần", async () => {
  const { tx, db } = fixture();
  const raw = "name,email,studentCode,academicClassCode\nNguyễn An,an@example.com,SV01,LOP01\nTrần Bình,binh@example.com,SV02,KHONGCO";
  const before = await previewImport(db, "students", raw); expect(before.valid).toBe(false); expect(before.rows[1].error).toContain("chưa tồn tại");
  const result = await commitImport(db, "admin", "students", raw, "password-test");
  expect(result.valid).toBe(false); expect(tx.user.create).not.toHaveBeenCalled(); expect(tx.auditLog.create).not.toHaveBeenCalled();
});
test("email trùng không phân biệt hoa thường và chuẩn hóa mã khi nhập", async () => {
  const { tx, db } = fixture();
  const raw = "name,email,studentCode,academicClassCode\nNguyễn An,an@example.com,sv01,lop01\nTrần Bình,AN@example.com,sv02,lop01";
  const result = await previewImport(db, "students", raw); expect(result.rows[1].error).toContain("lặp");
  await commitImport(db, "admin", "students", raw.split("\n").slice(0,2).join("\n"), "password-test");
  expect(tx.user.create.mock.calls[0][0].data.student.create).toMatchObject({ studentCode: "SV01", academicClassId: "lop" });
});

test("nhập phân công lấy học kỳ từ lớp học phần và đối chiếu tên học kỳ", async () => {
  const teacher = { facultyId: "f", user: { active: true, roles: [{ role: "LECTURER" }] } };
  const tx = {
    academicClass: { findUnique: vi.fn().mockResolvedValue({ id: "home", facultyId: "f", educationSystem: "REGULAR" }) },
    courseClass: {
      findUnique: vi.fn().mockResolvedValue({ id: "g", code: "A01", semesterId: "s2026", semester: { name: "Học kỳ 1" } }),
      findMany: vi.fn().mockResolvedValue([{ id: "g", courseId: "A", teachingConfigured: true, teachings: [{ lecturer: teacher }] }]),
    },
    enrollment: { findFirst: vi.fn().mockResolvedValue(null) },
  };
  const header = "semesterName,academicClassCode,courseClassCode\n";
  const result = await previewImport(tx as never, "assignments", header + "Học kỳ 1,LOP01,A01");
  expect(result.valid).toBe(true);
  expect(result.groups[0].semesterId).toBe("s2026");
  const wrongTerm = await previewImport(tx as never, "assignments", header + "Học kỳ 2,LOP01,A01");
  expect(wrongTerm.valid).toBe(false);
  expect(wrongTerm.rows[0].error).toContain("thuộc Học kỳ 1");
});
