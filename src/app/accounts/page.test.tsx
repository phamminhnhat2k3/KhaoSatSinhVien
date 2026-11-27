import { beforeEach, expect, test, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const m = vi.hoisted(() => ({ guard: vi.fn(), readFile: vi.fn(), verify: vi.fn(), users: vi.fn(), count: vi.fn(), faculties: vi.fn(), classes: vi.fn() }));
vi.mock("@/lib/access", () => ({ requireUser: m.guard }));
vi.mock("node:fs/promises", () => ({ readFile: m.readFile }));
vi.mock("argon2", () => ({ verify: m.verify }));
vi.mock("@/lib/db", () => ({ db: { user: { count: m.count, findMany: m.users }, faculty: { findMany: m.faculties }, academicClass: { findMany: m.classes } } }));
import AccountsPage, { metadata } from "./page";
beforeEach(() => {
  vi.resetAllMocks(); m.guard.mockResolvedValue({ id: "admin" }); m.count.mockResolvedValue(3); m.faculties.mockResolvedValue([]); m.classes.mockResolvedValue([]);
  m.readFile.mockResolvedValue("| Email | Mật khẩu |\n|---|---|\n| a@example.invalid | SamplePass9 |\n| b@example.invalid | StalePass9 |\n");
  m.verify.mockImplementation(async (hash: string) => hash === "valid-hash");
  m.users.mockResolvedValue(["a", "b", "c"].map((name, i) => ({ id: name, name, email: `${name}@example.invalid`, passwordHash: i === 0 ? "valid-hash" : "private-hash", roles: [{ role: "STUDENT" }], active: true, lecturer: null, student: null })));
});
test("chỉ hiện mật khẩu mẫu khớp mã băm, không đưa mã băm hoặc mật khẩu cũ ra HTML", async () => {
  const html = renderToStaticMarkup(await AccountsPage({ searchParams: Promise.resolve({}) }));
  expect(m.guard).toHaveBeenCalledWith("ADMIN");
  expect(html).toContain("SamplePass9"); expect(html).not.toContain("StalePass9");
  expect(html).not.toContain("valid-hash"); expect(html).not.toContain("private-hash");
  expect(html).toContain("Mật khẩu đã thay đổi"); expect(html).toContain("Không có mật khẩu đã lưu");
  expect(metadata.robots).toEqual({ index: false, follow: false });
});
test("không đọc file mật khẩu hoặc database khi người dùng không có quyền Admin", async () => {
  m.guard.mockRejectedValue(new Error("FORBIDDEN"));
  await expect(AccountsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("FORBIDDEN");
  expect(m.readFile).not.toHaveBeenCalled(); expect(m.users).not.toHaveBeenCalled(); expect(m.count).not.toHaveBeenCalled();
});
test("đọc file riêng được gắn vào Docker và dùng file local khi chưa có", async () => {
  await AccountsPage({ searchParams: Promise.resolve({}) });
  expect(m.readFile.mock.calls[0][0]).toContain("account-guide");
  m.readFile.mockRejectedValueOnce(new Error("ENOENT"));
  await AccountsPage({ searchParams: Promise.resolve({}) });
  expect(m.readFile.mock.calls.at(-1)?.[0]).toMatch(/TAI_KHOAN_MAU\.md$/);
  expect(m.readFile.mock.calls.at(-1)?.[0]).not.toContain("account-guide");
});
