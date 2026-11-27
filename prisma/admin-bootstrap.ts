import type { PrismaClient } from "@prisma/client";
import { hash } from "argon2";
import { z } from "zod";

export async function createInitialAdmin(db: PrismaClient, input: unknown) {
  const data = z.object({
    email: z.string().trim().email().transform(value => value.toLowerCase()),
    password: z.string().min(12).max(100),
  }).parse(input);
  const passwordHash = await hash(data.password);
  return db.$transaction(async tx => {
    if (await tx.user.findUnique({ where: { email: data.email }, select: { id: true } })) {
      throw new Error("Email đã tồn tại. Chọn email khác hoặc sử dụng chức năng quên mật khẩu.");
    }
    await tx.user.create({
      data: { email: data.email, name: "Quản trị viên", passwordHash, roles: { create: { role: "ADMIN" } } },
    });
  });
}
