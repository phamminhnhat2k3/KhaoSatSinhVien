import { expect, test } from "vitest";
import { campaignSchema } from "./input";

test("đợt khảo sát bao gồm trọn ngày theo giờ Việt Nam, kể cả chỉ mở một ngày", () => {
  const input = { title: "Đợt cuối kỳ", templateId: "t", scope: "UNIVERSITY", semesterId: "s", startsAt: "2026-10-23", endsAt: "2026-10-23" };
  const parsed = campaignSchema.parse(input);
  expect(parsed.startsAt.toISOString()).toBe("2026-10-22T17:00:00.000Z");
  expect(parsed.endsAt.toISOString()).toBe("2026-10-23T16:59:59.999Z");
  expect(campaignSchema.safeParse({ ...input, endsAt: "2026-10-22" }).success).toBe(false);
  expect(campaignSchema.safeParse({ ...input, startsAt: "2026-02-30" }).success).toBe(false);
});
test("toàn trường không được mang bộ lọc khoa/môn, khoa phải được chọn rõ ràng", () => {
  const input = { title: "Cơ sở vật chất", templateId: "t", scope: "UNIVERSITY", semesterId: "s", startsAt: "2026-10-23", endsAt: "2026-10-24" };
  expect(campaignSchema.safeParse({ ...input, facultyId: "f" }).success).toBe(false);
  expect(campaignSchema.safeParse({ ...input, courseTemplateId: "q", courseIds: ["A"] }).success).toBe(false);
  expect(campaignSchema.safeParse({ ...input, scope: "FACULTY" }).success).toBe(false);
  expect(campaignSchema.safeParse({ ...input, scope: "FACULTY", facultyId: "f", academicClassIds:["home"], courseTemplateId: "q", courseIds: ["A", "B"] }).success).toBe(true);
});

test("khoa bắt buộc chọn lớp và toàn trường không nhận bộ lọc lớp",()=>{
 const input={title:"Khảo sát",templateId:"t",scope:"FACULTY",facultyId:"f",semesterId:"s",startsAt:"2026-01-01",endsAt:"2026-02-01"};
 expect(campaignSchema.safeParse(input).success).toBe(false);
 expect(campaignSchema.safeParse({...input,academicClassIds:["home"]}).success).toBe(true);
 expect(campaignSchema.safeParse({...input,scope:"UNIVERSITY",facultyId:"",academicClassIds:["home"]}).success).toBe(false);
});
