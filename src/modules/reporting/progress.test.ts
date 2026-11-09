import { expect, test } from "vitest";
import { progressGroups } from "./progress";

test("tiến độ theo lớp tách nháp, đã gửi, chưa bắt đầu và xếp tỷ lệ thấp trước", () => {
  const row = (id: string | null, status: string) => ({ status, student: { academicClass: id ? { id, code: id, faculty: { name: "CNTT" } } : null } });
  const groups = progressGroups([row("A", "COMPLETED"), row("B", "DRAFT"), row("B", "INVITED"), row("A", "COMPLETED"), row(null, "INVITED")]);
  expect(groups.find(g => g.id === "A")).toMatchObject({ invited: 2, completed: 2, drafts: 0, rate: 100 });
  expect(groups.find(g => g.id === "B")).toMatchObject({ invited: 2, completed: 0, drafts: 1, rate: 0 });
  expect(groups.at(-1)?.id).toBe("A");
  expect(groups.find(g => g.id === "unassigned")?.title).toBe("Chưa phân lớp");
  expect(progressGroups([])).toEqual([]);
});
