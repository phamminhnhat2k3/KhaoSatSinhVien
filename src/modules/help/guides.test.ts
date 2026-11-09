import { expect, test } from "vitest";
import { roleGuides } from "./guides";

test("hướng dẫn đủ bốn vai trò, có bước và đường dẫn nội bộ", () => {
  expect(roleGuides.map(g => g.role).sort()).toEqual(["ADMIN", "DEAN", "LECTURER", "STUDENT"]);
  for (const guide of roleGuides) for (const step of guide.steps) {
    expect(step.href).toMatch(/^\/(admin|student|lecturer|dean)(\/|$)/);
    expect(step.instructions.length).toBeGreaterThan(1);
  }
});
