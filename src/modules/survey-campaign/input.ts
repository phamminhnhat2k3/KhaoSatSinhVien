import { z } from "zod";

export const campaignSchema = z.object({
  title: z.string().trim().min(3).max(120),
  evaluationMode:z.enum(["COURSE","LECTURER"]).default("COURSE"),
  templateId: z.string().min(1),
  scope: z.enum(["FACULTY", "UNIVERSITY"]),
  semesterId: z.string().min(1),
  facultyId: z.string().default(""),
  courseTemplateId: z.string().default(""),
  courseIds: z.array(z.string().min(1)).max(200).default([]),
  startsAt: z.iso.date().transform(date => new Date(`${date}T00:00:00+07:00`)),
  endsAt: z.iso.date().transform(date => new Date(`${date}T23:59:59.999+07:00`))
}).refine(v=>v.evaluationMode!=="LECTURER"||v.scope==="FACULTY"&&!!v.courseTemplateId&&v.courseIds.length>0,"Đánh giá giảng viên cần khoa, mẫu đánh giá và môn học.")
  .refine(value => value.endsAt > value.startsAt, "Ngày kết thúc không được trước ngày bắt đầu.")
  .refine(v => v.scope !== "FACULTY" || !!v.facultyId, "Chọn khoa tổ chức khảo sát.")
  .refine(v => v.scope !== "UNIVERSITY" || !v.courseTemplateId && !v.courseIds.length && !v.facultyId, "Khảo sát toàn trường chỉ dùng nội dung chung.")
  .refine(v => !!v.courseTemplateId === (v.courseIds.length > 0), "Phần môn học cần cả mẫu đánh giá và danh sách môn.");
