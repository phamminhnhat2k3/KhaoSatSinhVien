import { beforeEach, expect, test, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const m = vi.hoisted(() => ({ readFile: vi.fn(), verify: vi.fn(), users: vi.fn(), count: vi.fn(), faculties: vi.fn(), classes: vi.fn() }));
vi.mock("node:fs/promises", () => ({ readFile: m.readFile }));
vi.mock("argon2", () => ({ verify: m.verify }));
vi.mock("@/lib/db", () => ({ db: { user: { count: m.count, findMany: m.users }, faculty: { findMany: m.faculties }, academicClass: { findMany: m.classes } } }));
import AccountsPage, { metadata } from "./page";
beforeEach(() => {
  vi.resetAllMocks(); m.count.mockResolvedValue(2); m.faculties.mockResolvedValue([]); m.classes.mockResolvedValue([]);
  m.readFile.mockResolvedValue("| Email | Mật khẩu |\n|---|---|\n| a@example.invalid | SamplePass9 |\n| b@example.invalid | StalePass9 |\n");
  m.verify.mockImplementation(async (hash: string) => hash === "valid-hash");
  m.users.mockResolvedValue(["a", "b"].map((name, i) => ({ id: name, name, email: `${name}@example.invalid`, passwordHash: i === 0 ? "valid-hash" : "private-hash", roles: [{ role: "STUDENT" }], active: true, lecturer: null, student: null })));
});
test("chỉ hiện mật khẩu mẫu khớp mã băm, không đưa mã băm hoặc mật khẩu cũ ra HTML", async () => {
  const html = renderToStaticMarkup(await AccountsPage({ searchParams: Promise.resolve({}) }));
  expect(html).toContain("SamplePass9"); expect(html).not.toContain("StalePass9");
  expect(html).not.toContain("valid-hash"); expect(html).not.toContain("private-hash");
  expect(html).toContain("Mật khẩu đã thay đổi");
  expect(metadata.robots).toEqual({ index: false, follow: false });
});
test("trang công khai chỉ truy vấn email demo, không liệt kê tài khoản Admin hoặc email thật", async () => {
  const html = renderToStaticMarkup(await AccountsPage({ searchParams: Promise.resolve({}) }));
  const where = m.users.mock.calls[0][0].where;
  expect(where.AND).toContainEqual({ email: { in: ["a@example.invalid", "b@example.invalid"] } });
  expect(where.AND).toContainEqual({ roles: { none: { role: "ADMIN" } } });
  expect(m.faculties.mock.calls[0][0].where.classes.some.students.some.user.email.in).toEqual(["a@example.invalid", "b@example.invalid"]);
  expect(m.classes.mock.calls[0][0].where.students.some.user.email.in).toEqual(["a@example.invalid", "b@example.invalid"]);
  expect(html).toContain('href="/login"');
});
test("đọc file tài khoản đóng cùng ứng dụng; thiếu file thì không chọn tài khoản nào", async () => {
  await AccountsPage({ searchParams: Promise.resolve({}) });
  expect(m.readFile.mock.calls[0][0]).toMatch(/TAI_KHOAN_MAU\.md$/);
  m.readFile.mockRejectedValue(new Error("ENOENT"));
  await AccountsPage({ searchParams: Promise.resolve({}) });
  expect(m.users.mock.calls.at(-1)?.[0].where.AND).toContainEqual({ email: { in: [] } });
});
