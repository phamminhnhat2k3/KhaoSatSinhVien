import { expect, test } from "vitest";
import { accountPasswords } from "./passwords";
test("đọc mật khẩu từ bảng Admin và bảng sinh viên có thứ tự cột khác nhau", () => {
  const source = "| Họ tên | Email đăng nhập | Mật khẩu |\n|---|---|---|\n| A | ADMIN@example.invalid | SamplePass9 |\n\n| Email | Họ tên | Mật khẩu |\n|---|---|---|\n| student@example.invalid | B | OtherPass8 |";
  expect([...accountPasswords(source)]).toEqual([["admin@example.invalid", "SamplePass9"], ["student@example.invalid", "OtherPass8"]]);
});
test("không suy đoán mật khẩu từ email xuất hiện trong bảng phân công hoặc văn bản", () => {
  expect(accountPasswords("Mật khẩu chung: Example\n| Môn | Giảng viên |\n| A | teacher@example.invalid |\n").size).toBe(0);
  expect(accountPasswords("").size).toBe(0);
});
