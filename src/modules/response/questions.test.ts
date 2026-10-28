import { expect, test } from "vitest";
import { assignedQuestions } from "./questions";
import { validateAnswers } from "./rules";

const q = { id: "common", templateId: "t", content: "Đánh giá", type: "SCALE" as const, required: true, position: 1, scaleMin: 1, scaleMax: 5, scaleStep: 1, options: [] };
test("mỗi sinh viên chỉ nhận môn đã chốt, khóa trả lời không trùng giữa phần chung và các môn", () => {
  const campaign = { template: { questions: [q] }, courseTemplate: { questions: [{ ...q, id: "subject" }] } };
  const first = assignedQuestions(campaign, ["A", "B", "C"].map(courseId => ({ courseId, course: { code: courseId, name: courseId } })));
  const second = assignedQuestions(campaign, ["A", "D", "E"].map(courseId => ({ courseId, course: { code: courseId, name: courseId } })));
  expect(first.map(x => x.id)).toEqual(["common", "A:subject", "B:subject", "C:subject"]);
  expect(second.map(x => x.id)).toEqual(["common", "A:subject", "D:subject", "E:subject"]);
  expect(validateAnswers(second, { "B:subject": "5" })["B:subject"]).toBe("Câu hỏi không thuộc mẫu khảo sát.");
  expect(assignedQuestions({ template: campaign.template }, []).map(x => x.id)).toEqual(["common"]);
});
