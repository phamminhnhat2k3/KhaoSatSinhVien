import { expect, test } from "vitest";
import { userWhere, userEditSchema, userRemovalIssue } from "./user-management";
test("lọc người dùng theo giao các điều kiện và tìm cả mã sinh viên/giảng viên", () => {
  const where = userWhere({ q: "  GV001 ", role: "DEAN", facultyId: "f", academicClassId: "c", active: "false" });
  expect(where.AND).toHaveLength(5);
  expect(JSON.stringify(where)).toContain('"lecturerCode":{"contains":"GV001"}');
  expect(JSON.stringify(where)).toContain('"role":"DEAN"');
  expect(userWhere({ role: "FAKE", active: "unknown" })).toEqual({ AND: [] });
});
test("sửa người dùng kiểm tra đầu vào và chuẩn hóa email", () => {
  expect(userEditSchema.parse({ id: "u", name: "Tên mới", email: "User@example.com", phone: "" }).email).toBe("user@example.com");
  expect(userEditSchema.safeParse({ id: "", name: "x", email: "invalid", phone: "" }).success).toBe(false);
});
test("xóa không được làm mất lịch sử hay tài khoản quản trị", () => {
  const target = { id: "other", roles: [{ role: "STUDENT" }], auditLogs: 0, participations: 0, classes: 0 };
  expect(userRemovalIssue("actor", target)).toBeNull();
  expect(userRemovalIssue("other", target)).toContain("đang đăng nhập");
  for (const key of ["auditLogs", "participations", "classes"]) expect(userRemovalIssue("actor", { ...target, [key]: 1 })).toContain("lịch sử");
  expect(userRemovalIssue("actor", { ...target, roles: [{ role: "ADMIN" }] })).toContain("quản trị");
});
