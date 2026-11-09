import { expect, test } from "vitest";
import { comparisonPoints } from "./comparison";
import { noteVisibility, noteSchema } from "./notes";
test("điểm chung có trọng số, không suy ngược ô thiếu ngưỡng", () => {
  const r = (average: number, respondents: number, suppressed = false) => ({ content: "Điểm", average, respondents, suppressed, scaleMin: 1, scaleMax: 5 });
  const result = comparisonPoints([[r(2, 2)], [r(5, 6)], [r(1, 1, true)]], ["Hỗ trợ học tập"]);
  expect(result[0][0]).toMatchObject({ baseline: 4.25, average: 2, attention: true });
  expect(result[2][0]).toMatchObject({ average: null, baseline: 4.25 });
  expect(comparisonPoints([[r(1, 1, true)]], ["Điểm"])[0][0].baseline).toBeNull();
});
test("ghi nhận có phạm vi tác giả, khoa và chỉ bản gửi được chia sẻ", () => {
  expect(noteVisibility({ id: "gv", roles: ["LECTURER"] })).toEqual({ authorId: "gv" });
  expect(JSON.stringify(noteVisibility({ id: "tk", roles: ["DEAN"], facultyId: "cntt" }))).toContain('"facultyId":"cntt"');
  expect(noteSchema.safeParse({ title: "x", observation: "", plan: "" }).success).toBe(false);
});
test("nhận xét nháp được lưu khi kế hoạch còn dang dở, bản gửi phải đủ nội dung", () => {
  const draft = { campaignId: "dot", courseId: "mon", lecturerIds: ["gv"], title: "Nhận xét nháp", observation: "", plan: "", send: false };
  expect(noteSchema.safeParse(draft).success).toBe(true);
  expect(noteSchema.safeParse({ ...draft, send: true }).success).toBe(false);
});
