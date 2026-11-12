"use server";

import { revalidatePath } from "next/cache";
import { hash, verify } from "argon2";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { profileSchema, passwordSchema } from "@/modules/profile/rules";
import { signOut } from "@/auth";

export async function updateProfile(_: { ok: boolean; message: string } | undefined, form: FormData) {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  try {
    await db.$transaction(async tx => {
      await tx.user.update({ where: { id: user.id }, data: parsed.data });
      await tx.auditLog.create({ data: { actorId: user.id, action: "UPDATE_PROFILE", entity: "User", entityId: user.id } });
    });
  } catch { return { ok: false, message: "Không thể lưu hồ sơ. Vui lòng thử lại." }; }
  revalidatePath("/", "layout");
  return { ok: true, message: "Đã cập nhật hồ sơ của bạn." };
}
export async function updatePassword(_: { ok: boolean; message: string } | undefined, form: FormData) {
  const user = await requireUser();
  const parsed = passwordSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const account = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verify(account.passwordHash, parsed.data.currentPassword))) return { ok: false, message: "Mật khẩu hiện tại không đúng." };
  try {
    await db.$transaction(async tx => {
      const changed = await tx.user.updateMany({ where: { id: user.id, passwordHash: account.passwordHash }, data: { passwordHash: await hash(parsed.data.newPassword) } });
      if (!changed.count) throw new Error("Password changed concurrently");
      await tx.auditLog.create({ data: { actorId: user.id, action: "CHANGE_PASSWORD", entity: "User", entityId: user.id } });
      await tx.notification.create({ data: { userId: user.id, title: "Mật khẩu đã được thay đổi", body: "Mật khẩu đăng nhập của bạn vừa được cập nhật từ trang hồ sơ.", href: "/profile" } });
    });
  } catch { return { ok: false, message: "Không thể đổi mật khẩu. Vui lòng thử lại." }; }
  await signOut({ redirectTo: "/login?passwordChanged=1" });
}
