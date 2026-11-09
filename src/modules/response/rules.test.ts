import { expect, test } from "vitest";
import { validateAnswers } from "./rules";
test("tự luận bắt buộc không chấp nhận toàn khoảng trắng", () => {
  const question = { id: "q", type: "TEXT" as const, required: true };
  expect(validateAnswers([question], { q: " \n\t " })).toHaveProperty("q");
  expect(validateAnswers([question], { q: "Góp ý cụ thể" })).toEqual({});
  expect(validateAnswers([{ ...question, required: false }], { q: " " })).toEqual({});
});
