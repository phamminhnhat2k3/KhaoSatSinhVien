import { describe, expect, it } from "vitest";
import { canManageFaculty } from "./permissions";
describe("faculty permissions", () => {
  it("allows administrators across faculties", () => expect(canManageFaculty(["ADMIN"], null, "other")).toBe(true));
  it("restricts deans to their assigned faculty", () => {
    expect(canManageFaculty(["DEAN"], "a", "a")).toBe(true);
    expect(canManageFaculty(["DEAN"], "a", "b")).toBe(false);
    expect(canManageFaculty(["DEAN"], null, null)).toBe(false);
    expect(canManageFaculty(["LECTURER"], "a", "a")).toBe(false);
  });
});
