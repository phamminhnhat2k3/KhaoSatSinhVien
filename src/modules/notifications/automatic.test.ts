import { expect, test, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { pendingReminderWhere, reminderId, runAutomaticReminders } from "./automatic";
test("khóa nhắc trùng cùng ngày dùng chung tự động và nhắc tay, kiểm tra đủ 24 giờ", () => {
  const now=new Date("2026-11-13T10:00:00Z");
  expect(reminderId("c","u",now)).toBe(reminderId("c","u",new Date(+now+1000)));
  expect(reminderId("c","u",now)).not.toBe(reminderId("c","v",now));
  expect(pendingReminderWhere("c",now)).toMatchObject({status:{not:"COMPLETED"},student:{user:{active:true,roles:{some:{role:"STUDENT"}},notifications:{none:{createdAt:{gt:new Date(+now-86400000)}}}}}});
});
test("chỉ quét đợt đang mở còn tối đa ba ngày, gửi trong giao dịch",async()=>{
  const now=new Date(),tx={surveyCampaign:{findUniqueOrThrow:vi.fn().mockResolvedValue({status:"PUBLISHED",startsAt:new Date(+now-1000),endsAt:new Date(+now+1000),title:"Đợt"})},surveyParticipation:{findMany:vi.fn().mockResolvedValue([{student:{userId:"sv"}}])},notification:{createMany:vi.fn().mockResolvedValue({count:1})}};
  const findMany=vi.fn().mockResolvedValue([{id:"c"}]);
  const db={surveyCampaign:{findMany},$transaction:(fn:(arg:typeof tx)=>unknown)=>fn(tx)}as unknown as PrismaClient;
  expect(await runAutomaticReminders(db,now)).toBe(1);
  expect(findMany.mock.calls[0][0].where.endsAt).toEqual({gte:now,lte:new Date(+now+3*86400000)});
  expect(tx.notification.createMany.mock.calls[0][0].skipDuplicates).toBe(true);
});
