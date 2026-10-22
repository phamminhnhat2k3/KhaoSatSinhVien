import { expect, test } from "vitest";
import { moveQuestion, newQuestion, templateSchema } from "./rules";
import { answersFrom, validateAnswers } from "@/modules/response/rules";

test("thang tùy chỉnh được xác thực cả khi thiết kế và trả lời", () => {
  const question = { ...newQuestion("SCALE"), content: "Mức độ hài lòng", scaleMin: 0, scaleMax: 100, scaleStep: 10 };
  expect(templateSchema.safeParse({ title: "Khảo sát thử", questions: [question] }).success).toBe(true);
  expect(templateSchema.safeParse({ title: "Khảo sát thử", questions: [{ ...question, scaleStep: 3 }] }).success).toBe(false);
  expect(validateAnswers([{ ...question, id: "q" }], { q: "100" })).toEqual({});
  for (const value of ["101", "-1", "15", " "]) expect(validateAnswers([{ ...question, id: "q" }], { q: value }).q).toBeTruthy();
});
test("lựa chọn trống, trùng và mẫu rỗng không được lưu", () => {
  const q = { ...newQuestion("SINGLE"), content: "Chọn một phương án" };
  expect(templateSchema.safeParse({ title: "Khảo sát", questions: [q] }).success).toBe(false);
  expect(templateSchema.safeParse({ title: "Khảo sát", questions: [{ ...q, options: [{ label: "Tốt", value: "1" }, { label: "tốt", value: "2" }] }] }).success).toBe(false);
  expect(templateSchema.safeParse({ title: "Khảo sát", questions: [] }).success).toBe(false);
});
test("di chuyển câu hỏi giữ nguyên dữ liệu và không sửa mảng đầu vào", () => {
  const items = [newQuestion("TEXT"), newQuestion("SCALE"), newQuestion("MULTIPLE")];
  expect(moveQuestion(items, 0, 2).map(q => q.type)).toEqual(["SCALE", "MULTIPLE", "TEXT"]);
  expect(items[0].type).toBe("TEXT");
  expect(moveQuestion(items, -1, 3)).toBe(items);
});
test("một checkbox vẫn là mảng, câu hỏi ngoài mẫu bị từ chối", () => {
  const form = new FormData(); form.append("q_multiple[]", "a"); form.append("q_scale", "10");
  expect(answersFrom(form)).toEqual({ multiple: ["a"], scale: "10" });
  expect(validateAnswers([], { foreign: "data" }).foreign).toBeTruthy();
});
