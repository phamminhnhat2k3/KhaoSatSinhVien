import { expect, test } from "vitest";
import { entityReadAccess } from "./entity-access";
test("quyền đọc hồ sơ phân biệt Admin, Trưởng khoa và tài khoản thường", () => {
  expect(entityReadAccess({ active: true, roles: [{ role: "ADMIN" }] })).toEqual({ admin: true, facultyId: undefined });
  expect(entityReadAccess({ active: true, roles: [{ role: "DEAN" }], lecturer: { facultyId: "f" } })).toEqual({ admin: false, facultyId: "f" });
  for (const actor of [null, { active: true, roles: [{ role: "STUDENT" }] }, { active: true, roles: [{ role: "LECTURER" }], lecturer: { facultyId: "f" } }, { active: true, roles: [{ role: "DEAN" }] }, { active: false, roles: [{ role: "ADMIN" }] }]) expect(entityReadAccess(actor)).toBeNull();
});
