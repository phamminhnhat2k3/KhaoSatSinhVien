import { expect, test } from "vitest";
import { studentFilterHref, studentWorklist } from "./student-worklist";

const now = new Date("2026-11-06T00:00:00Z");
const task = (id: string, status = "INVITED", start = -1, end = 3, state: "PUBLISHED" | "CLOSED" | "CANCELLED" = "PUBLISHED") => ({ id, status, campaign: { status: state, startsAt: new Date(now.getTime() + start * 86400000), endsAt: new Date(now.getTime() + end * 86400000) } });
test("bản nháp được ưu tiên, sau đó theo hạn gửi, không trộn phiếu sắp mở vào việc cần làm", () => {
  const items = [task("later", "INVITED", -1, 8), task("soon", "INVITED", -1, 1), task("draft", "DRAFT", -1, 7), task("future", "INVITED", 1, 3)];
  const work = studentWorklist(items, now);
  expect(work.open.map(p => p.id)).toEqual(["draft", "soon", "later"]);
  expect(work.drafts.map(p => p.id)).toEqual(["draft"]);
  expect(work.scheduled.map(p => p.id)).toEqual(["future"]);
  expect(items.map(p => p.id)).toEqual(["later", "soon", "draft", "future"]);
});
test("phiếu đã gửi nằm trong lịch sử, quá hạn/đóng/hủy không có thao tác trả lời", () => {
  const work = studentWorklist([task("sent", "COMPLETED", -5, -1), task("expired", "DRAFT", -5, -1), task("closed", "INVITED", -1, 3, "CLOSED"), task("cancelled", "INVITED", -1, 3, "CANCELLED")], now);
  expect(work.open).toEqual([]); expect(work.drafts).toEqual([]);
  expect(work.completed.map(p => p.id)).toEqual(["sent"]);
  expect(work.ended.map(p => p.id)).toEqual(["expired", "closed", "cancelled"]);
});
test("lọc nhanh giữ học kỳ và từ khóa, trở về tất cả vẫn giữ điều kiện đang xem", () => {
  const params = { semesterId: "hk1", q: "Cơ khí & học tập" };
  const draft = new URL(studentFilterHref(params, "draft"), "http://test.local");
  expect(draft.searchParams.get("view")).toBe("draft"); expect(draft.searchParams.get("q")).toBe(params.q); expect(draft.searchParams.get("semesterId")).toBe("hk1");
  expect(new URL(studentFilterHref(params, "all"), "http://test.local").searchParams.has("view")).toBe(false);
  expect(studentFilterHref({}, "all")).toBe("/student");
});
