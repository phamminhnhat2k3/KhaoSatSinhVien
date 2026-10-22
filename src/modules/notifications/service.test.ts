import { expect, test, vi } from "vitest";
import { markRead, notifyCampaign } from "./service";

test("đánh dấu đọc luôn bị giới hạn theo tài khoản đang đăng nhập", async () => {
  const db = { notification: { updateMany: vi.fn() } };
  await markRead(db as never, "owner", "another-users-notification");
  expect(db.notification.updateMany).toHaveBeenCalledWith({ where: { userId: "owner", readAt: null, id: "another-users-notification" }, data: { readAt: expect.any(Date) } });
  await markRead(db as never, "owner");
  expect(db.notification.updateMany).toHaveBeenLastCalledWith({ where: { userId: "owner", readAt: null }, data: { readAt: expect.any(Date) } });
});
test("thông báo công bố gửi đúng vai trò, không trùng giảng viên nhiều lớp", async () => {
  const tx = { surveyCampaign: { findUniqueOrThrow: vi.fn().mockResolvedValue({ title: "Khảo sát", startsAt: new Date(), endsAt: new Date(), participations: [{ student: { userId: "student" } }], targets: [{ class: { lecturer: { userId: "teacher" } } }, { class: { lecturer: { userId: "teacher" } } }] }) }, notification: { createMany: vi.fn() } };
  await notifyCampaign(tx as never, "campaign", "admin", "PUBLISHED");
  const rows = tx.notification.createMany.mock.calls[0][0].data;
  expect(rows.map((r: { userId: string }) => r.userId)).toEqual(["student", "teacher", "admin"]);
  expect(rows.map((r: { href: string }) => r.href)).toEqual(["/student", "/lecturer", "/admin"]);
  expect(rows.every((r: { body: string }) => !r.body.includes("student"))).toBe(true);
});
