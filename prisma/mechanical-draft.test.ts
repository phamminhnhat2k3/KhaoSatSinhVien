import {expect,test} from "vitest";
import input from "./mechanical-draft.json";
import {templateSchema} from "../src/modules/templates/rules";
import {campaignSchema} from "../src/modules/survey-campaign/input";
test("mẫu Cơ khí có nội dung hợp lệ, đủ bốn loại câu và góp ý tự nguyện",()=>{
 const template=templateSchema.parse(input);
 expect(template.questions).toHaveLength(10);
 expect(new Set(template.questions.map(q=>q.type)).size).toBe(4);
 expect(template.questions.filter(q=>q.type==="TEXT").every(q=>!q.required)).toBe(true);
});
test("đợt khảo sát chung trong khoa không yêu cầu môn hoặc mẫu môn học",()=>{
 const campaign=campaignSchema.parse({title:input.title,templateId:"template",scope:"FACULTY",academicClassIds:["home"],facultyId:"faculty",semesterId:"semester",startsAt:"2026-10-31",endsAt:"2026-11-30"});
 expect(campaign.courseIds).toEqual([]);
 expect(campaign.courseTemplateId).toBe("");
});
