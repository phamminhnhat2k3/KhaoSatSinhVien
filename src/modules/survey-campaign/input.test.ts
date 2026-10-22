import { expect, test } from "vitest";
import { campaignSchema } from "./input";

test("đợt khảo sát bao gồm trọn ngày theo giờ Việt Nam, kể cả chỉ mở một ngày", () => {
  const input = { title: "Đợt cuối kỳ", templateId: "t", classIds: ["c"], startsAt: "2026-10-23", endsAt: "2026-10-23" };
  const parsed = campaignSchema.parse(input);
  expect(parsed.startsAt.toISOString()).toBe("2026-10-22T17:00:00.000Z");
  expect(parsed.endsAt.toISOString()).toBe("2026-10-23T16:59:59.999Z");
  expect(campaignSchema.safeParse({ ...input, endsAt: "2026-10-22" }).success).toBe(false);
  expect(campaignSchema.safeParse({ ...input, startsAt: "2026-02-30" }).success).toBe(false);
});
