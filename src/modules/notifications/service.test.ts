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

test("không gửi thông báo cho giảng viên cũ chỉ còn liên kết ở cấp môn", async () => {
  const tx = {
    surveyCampaign: { findUniqueOrThrow: vi.fn().mockResolvedValue({ title: "Khoa", facultyId: "f", semesterId: "s", startsAt: new Date(), endsAt: new Date(), participations: [], targets: [{ class: { lecturer: null } }], courseTargets: [{ course: { classes: [{ semesterId: "s", teachingConfigured: true, lecturer: null, teachings: [] }], lecturers: [{ userId: "former-teacher" }] } }] }) },
    lecturerProfile: { findMany: vi.fn().mockResolvedValue([{ userId: "dean" }]) },
    notification: { createMany: vi.fn() }
  };
  await notifyCampaign(tx as never, "campaign", "admin", "PUBLISHED");
  const rows = tx.notification.createMany.mock.calls[0][0].data;
  expect(rows.map((r: { userId: string; href: string }) => [r.userId, r.href])).toEqual([["dean", "/dean"], ["admin", "/admin"]]);
  expect(tx.lecturerProfile.findMany.mock.calls[0][0].where.facultyId).toBe("f");
});
test("đánh giá giảng viên thông báo theo người dạy đã chốt, không gửi người chỉ được phân công môn",async()=>{
  const tx={surveyCampaign:{findUniqueOrThrow:vi.fn().mockResolvedValue({title:"Đánh giá GV",evaluationMode:"LECTURER",startsAt:new Date(),endsAt:new Date(),targets:[],courseTargets:[{course:{classes:[],lecturers:[{userId:"not-teaching"}]}}],participations:[{student:{userId:"student"},teachings:[{lecturer:{userId:"actual"}},{lecturer:{userId:"actual"}}]}]})},notification:{createMany:vi.fn()}};
  await notifyCampaign(tx as never,"campaign","admin","PUBLISHED");
  expect(tx.notification.createMany.mock.calls[0][0].data.map((r:{userId:string})=>r.userId)).toEqual(["student","actual","admin"]);
});
test("đóng đợt môn học thông báo cả phân công mới và giữ đường dẫn đúng báo cáo", async () => {
  const tx = {
    surveyCampaign: { findUniqueOrThrow: vi.fn().mockResolvedValue({ title: "Đợt môn", facultyId: "f", semesterId: "s", evaluationMode: "COURSE", startsAt: new Date(), endsAt: new Date(), participations: [], targets: [], courseTargets: [{ course: { lecturers: [{ userId: "former" }], classes: [{ semesterId: "s", teachingConfigured: true, lecturer: { userId: "old" }, teachings: [{ lecturer: { userId: "actual" } }] }, { semesterId: "other", teachings: [{ lecturer: { userId: "wrong-term" } }] }] } }] }) },
    lecturerProfile: { findMany: vi.fn().mockResolvedValue([{ userId: "dean" }]) }, notification: { createMany: vi.fn() },
  };
  await notifyCampaign(tx as never, "c", "admin", "CLOSED");
  expect(tx.notification.createMany.mock.calls[0][0].data.map((r: { userId: string; href: string }) => [r.userId, r.href])).toEqual([["actual", "/lecturer?campaign=c"], ["dean", "/dean?campaign=c"], ["admin", "/admin"]]);
});
