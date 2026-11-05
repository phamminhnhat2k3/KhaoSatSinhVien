import { expect, test } from "vitest";
import { academicClassLabel, educationSystem, educationSystemSchema } from "./education";

test("ba hệ học có tên và nhãn ngắn, không đổi mã hoặc tên lớp gốc", () => {
  for (const [value, name, tag] of [["REGULAR", "Chính quy", "CQ"], ["PART_TIME", "Vừa học vừa làm", "VLVH"], ["DISTANCE", "Đào tạo từ xa", "ĐTTX"]]) {
    expect(educationSystemSchema.parse(value)).toBe(value);
    expect(educationSystem(value)).toEqual({ name, tag });
    const group = { code: "CNTT01", name: "Công nghệ thông tin 01", educationSystem: value };
    expect(academicClassLabel(group)).toBe(`CNTT01 · Công nghệ thông tin 01 [${tag}]`);
    expect(group.code).toBe("CNTT01");
    expect(group.name).toBe("Công nghệ thông tin 01");
  }
  expect(educationSystemSchema.safeParse("OTHER").success).toBe(false);
  expect(educationSystem("OTHER").name).toBe("Chưa xác định");
});
