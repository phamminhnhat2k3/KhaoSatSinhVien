import { beforeEach, expect, test, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), user: vi.fn() }));
vi.mock("@/auth", () => ({ auth: m.auth }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: m.user } } }));
import { currentUser } from "./access";
beforeEach(() => { vi.resetAllMocks(); m.auth.mockResolvedValue({ user: { id: "u", roles: ["ADMIN"] } }); });
test("phiên cũ không cho tài khoản đã khóa hoặc xóa tiếp tục đọc dữ liệu", async () => {
  for (const user of [null, { active: false }]) { m.user.mockResolvedValue(user); expect(await currentUser()).toBeNull(); }
  m.auth.mockResolvedValue(null); expect(await currentUser()).toBeNull();
});
test("quyền hiện tại lấy từ database thay vì quyền cũ trong JWT", async () => {
  m.user.mockResolvedValue({ id: "u", name: "Người dùng", email: "u@example.invalid", active: true, roles: [{ role: "STUDENT" }] });
  expect(await currentUser()).toEqual({ id: "u", name: "Người dùng", email: "u@example.invalid", roles: ["STUDENT"] });
  expect(m.user.mock.calls[0][0].select).not.toHaveProperty("passwordHash");
});
