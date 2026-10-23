import { expect, test } from "vitest";
import { displayAnswer } from "./answers";

const question = { type: "MULTIPLE", scaleMin: 0, scaleMax: 100, options: [{ value: "material", label: "Tài liệu" }, { value: "practice", label: "Thực hành" }] };
test("phiếu đã nộp hiển thị nhãn lựa chọn và đúng thang điểm", () => {
  expect(displayAnswer(question, ["material", "practice"])).toBe("Tài liệu; Thực hành");
  expect(displayAnswer({ ...question, type: "SINGLE" }, "material")).toBe("Tài liệu");
  expect(displayAnswer({ ...question, type: "SCALE" }, "0")).toBe("0 điểm · Thang 0–100");
  expect(displayAnswer({ ...question, type: "TEXT" }, "Ý kiến\ncụ thể")).toBe("Ý kiến\ncụ thể");
  expect(displayAnswer(question, undefined)).toBe("Không trả lời");
  expect(displayAnswer(question, [])).toBe("Không trả lời");
});
