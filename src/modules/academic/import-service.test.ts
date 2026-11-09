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
