import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { createInitialAdmin } from "../../prisma/admin-bootstrap";

test("khởi tạo admin cho database mới và từ chối ghi đè tài khoản", async () => {
  test.skip(!process.env.ISOLATED_FEATURE_DB, "Chỉ dùng database nghiệm thu riêng.");
  const db = new PrismaClient();
  const email = `bootstrap-${randomUUID()}@example.invalid`;
  try {
    expect(new URL(process.env.DATABASE_URL!).pathname).toBe(`/${process.env.ISOLATED_FEATURE_DB}`);
    await createInitialAdmin(db, { email, password: randomUUID() });
    const user = await db.user.findUniqueOrThrow({ where: { email }, include: { roles: true } });
    expect(user.roles.map(role => role.role)).toEqual(["ADMIN"]);
    await expect(createInitialAdmin(db, { email, password: randomUUID() })).rejects.toThrow("Email đã tồn tại");
    expect((await db.user.findUniqueOrThrow({ where: { email } })).passwordHash).toBe(user.passwordHash);
  } finally {
    await db.$disconnect();
  }
});
