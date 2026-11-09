import { expect, test } from "vitest";
import { csvCell } from "./csv";
test("CSV giữ dấu phẩy, xuống dòng và dấu ngoặc kép", () => {
  expect(csvCell('Góp ý, "tốt"\nxong')).toBe('"Góp ý, ""tốt""\nxong"');
  expect(csvCell(null)).toBe('""'); expect(csvCell(5)).toBe('"5"');
});
test("nội dung tự luận không được thực thi thành công thức khi mở bảng tính", () => {
  for (const value of ['=HYPERLINK("https://example.invalid")', '+SUM(1,2)', '-1+2', '@SUM(A1)', '\t=1+1', '\r\n=1+1']) expect(csvCell(value)).toBe(`"'${value.replaceAll('"', '""')}"`);
});
