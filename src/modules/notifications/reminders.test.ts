import { expect, test, vi } from "vitest";
import type { Prisma } from "@prisma/client";
import { remindPending } from "./reminders";
test("nhắc đúng sinh viên chưa hoàn thành và chặn nhắc lặp hoặc đợt đã đóng", async () => {
  const now = new Date(), campaign = { status: "PUBLISHED", startsAt: new Date(+now-1000), endsAt: new Date(+now+1000), title: "Đợt" };
  const mock = { surveyCampaign: { findUniqueOrThrow: vi.fn().mockResolvedValue(campaign) }, auditLog: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn() }, surveyParticipation: { findMany: vi.fn().mockResolvedValue([{ student: { userId: "sv1" } }]) }, notification: { createMany: vi.fn().mockResolvedValue({count:1}) } };
  const tx = mock as unknown as Prisma.TransactionClient;
  expect(await remindPending(tx, "dot", "admin", now)).toBe(1);
  expect(mock.surveyParticipation.findMany.mock.calls[0][0].where.status).toEqual({ not: "COMPLETED" });
  expect(mock.notification.createMany.mock.calls[0][0].data[0].userId).toBe("sv1");
  mock.auditLog.findFirst.mockResolvedValue({ id: "already" }); await expect(remindPending(tx, "dot", "admin", now)).rejects.toThrow("24 giờ");
  mock.surveyCampaign.findUniqueOrThrow.mockResolvedValue({ ...campaign, status: "CLOSED" }); await expect(remindPending(tx, "dot", "admin", now)).rejects.toThrow("tiếp nhận");
});
