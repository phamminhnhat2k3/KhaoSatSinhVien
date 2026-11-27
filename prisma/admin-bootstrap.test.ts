import { expect, test, vi } from "vitest";
import { verify } from "argon2";
import { createInitialAdmin } from "./admin-bootstrap";

function database(existing = false) {
  const tx = { user: { findUnique: vi.fn().mockResolvedValue(existing ? { id: "old" } : null), create: vi.fn() } };
  return { tx, db: { $transaction: vi.fn(async (run: (client: typeof tx) => unknown) => run(tx)) } };
}
test("tạo admin với email chuẩn hóa và mật khẩu băm", async () => {
  const { db, tx } = database();
  await createInitialAdmin(db as never, { email: " ADMIN@example.com ", password: "new-password-123" });
  const data = tx.user.create.mock.calls[0][0].data;
  expect(data.email).toBe("admin@example.com");
  expect(data.roles.create.role).toBe("ADMIN");
  expect(await verify(data.passwordHash, "new-password-123")).toBe(true);
});
test("từ chối email đã có và mật khẩu yếu trước khi tạo tài khoản", async () => {
  const { db, tx } = database(true);
  await expect(createInitialAdmin(db as never, { email: "admin@example.com", password: "new-password-123" })).rejects.toThrow("Email đã tồn tại");
  expect(tx.user.create).not.toHaveBeenCalled();
  await expect(createInitialAdmin(db as never, { email: "admin@example.com", password: "short" })).rejects.toThrow();
  expect(tx.user.create).not.toHaveBeenCalled();
});
