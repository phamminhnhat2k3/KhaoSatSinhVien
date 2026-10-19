import { describe, expect, it } from "vitest";
import { normalizeAcademicCode } from "./rules";

describe("mã học vụ", () => {
  it("chuẩn hóa mã trước khi kiểm tra trùng", () => expect(normalizeAcademicCode(" se401.02 ")).toBe("SE401.02"));
});
