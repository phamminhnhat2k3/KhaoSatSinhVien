import { expect, test } from "vitest";
import { parseImportCsv } from "./import-csv";
test("CSV Excel BOM, dấu phẩy trong tên, xuống dòng và ngoặc kép", () => {
  const rows = parseImportCsv('\uFEFFname,email,studentCode,academicClassCode\r\n"Nguyễn, Văn ""An""\nMinh",a@example.com,SV001,CNTT01\r\n', "students");
  expect(rows[0].data.name).toBe('Nguyễn, Văn "An"\nMinh'); expect(rows[0].error).toBe("");
});
test("CSV dấu chấm phẩy, sai số cột, sai header và quá số dòng", () => {
  expect(parseImportCsv("name;email;studentCode;academicClassCode\nAn;a@example.com;SV001", "students")[0].error).not.toBe("");
  expect(() => parseImportCsv("email,name\na,b", "students")).toThrow("tiêu đề");
  expect(() => parseImportCsv('name,email,studentCode,academicClassCode\n"An,a,b,c', "students")).toThrow("ngoặc kép");
  expect(() => parseImportCsv("name,email,studentCode,academicClassCode\n" + "An,a,b,c\n".repeat(201), "students")).toThrow("200 dòng");
});
