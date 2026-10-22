import { expect, test } from "vitest";
import { passwordSchema, profileSchema } from "./rules";

test("chỉ nhận các trường hồ sơ cho phép, không cho đổi vai trò qua payload", () => {
  const input = { name: " Nguyễn Văn An ", phone: "0901234567", bio: "Giới thiệu", department: "CNTT", coverTheme: "blue", roles: ["ADMIN"], studentCode: "NEW" };
  expect(profileSchema.parse(input)).toEqual({ name: "Nguyễn Văn An", phone: "0901234567", bio: "Giới thiệu", department: "CNTT", coverTheme: "blue" });
  expect(profileSchema.safeParse({ ...input, phone: "not-a-phone" }).success).toBe(false);
  expect(profileSchema.safeParse({ ...input, bio: "a".repeat(1001) }).success).toBe(false);
});
test("mật khẩu mới cần độ dài và xác nhận đúng", () => {
  expect(passwordSchema.safeParse({ currentPassword: "old-password", newPassword: "new-password", confirmPassword: "new-password" }).success).toBe(true);
  expect(passwordSchema.safeParse({ currentPassword: "old-password", newPassword: "new-password", confirmPassword: "different" }).success).toBe(false);
  expect(passwordSchema.safeParse({ currentPassword: "old-password", newPassword: "old-password", confirmPassword: "old-password" }).success).toBe(false);
});
