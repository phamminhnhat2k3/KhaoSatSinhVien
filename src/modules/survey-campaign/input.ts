import { z } from "zod";

export const campaignSchema = z.object({
  title: z.string().trim().min(3).max(120),
  templateId: z.string().min(1),
  classIds: z.array(z.string().min(1)).min(1),
  startsAt: z.iso.date().transform(date => new Date(`${date}T00:00:00+07:00`)),
  endsAt: z.iso.date().transform(date => new Date(`${date}T23:59:59.999+07:00`))
}).refine(value => value.endsAt > value.startsAt, "Ngày kết thúc không được trước ngày bắt đầu.");
