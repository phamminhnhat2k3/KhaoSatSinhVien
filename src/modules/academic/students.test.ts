import { expect, test } from "vitest";
import { studentSchema, studentWhere } from "./students";
test("sinh viên cần lớp hành chính, không bắt buộc đăng ký môn ngay", () => {
  const input = { name: "Sinh viên", email: "sv@example.com", studentCode: "sv01", password: "abcdefgh", academicClassId: "class" };
  expect(studentSchema.parse(input).courseClassIds).toEqual([]);
  expect(studentSchema.safeParse({ ...input, academicClassId: "" }).success).toBe(false);
});
test("lọc khoa và lớp hành chính không dùng bảng ghi danh lớp học phần", () => {
  const where = studentWhere({ q: " SV01 ", facultyId: "faculty", academicClassId: "homeroom" });
  expect(where.academicClass).toEqual({ facultyId: "faculty" });
  expect(where.academicClassId).toBe("homeroom");
  expect(where.OR?.[0]).toEqual({ studentCode: { contains: "SV01" } });
  expect(where).not.toHaveProperty("enrollments");
});
