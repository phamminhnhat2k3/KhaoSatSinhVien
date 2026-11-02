import { expect, test } from "vitest";
import { assignedQuestions } from "./questions";
import { validateAnswers } from "./rules";

const q = { id: "common", templateId: "t", content: "Đánh giá", type: "SCALE" as const, required: true, position: 1, scaleMin: 1, scaleMax: 5, scaleStep: 1, options: [] };
test("mỗi sinh viên chỉ nhận môn đã chốt, khóa trả lời không trùng giữa phần chung và các môn", () => {
  const campaign = { template: { questions: [q] }, courseTemplate: { questions: [{ ...q, id: "subject" }] } };
  const first = assignedQuestions(campaign, ["A", "B", "C"].map(courseId => ({ courseId, course: { code: courseId, name: courseId } })));
  const second = assignedQuestions(campaign, ["A", "D", "E"].map(courseId => ({ courseId, course: { code: courseId, name: courseId } })));
  expect(first.map(x => x.id)).toEqual(["common", "A:subject", "B:subject", "C:subject"]);
  expect(second.map(x => x.id)).toEqual(["common", "A:subject", "D:subject", "E:subject"]);
  expect(validateAnswers(second, { "B:subject": "5" })["B:subject"]).toBe("Câu hỏi không thuộc mẫu khảo sát.");
  expect(assignedQuestions({ template: campaign.template }, []).map(x => x.id)).toEqual(["common"]);
});
test("mỗi giảng viên có khóa câu trả lời riêng, không nhận giảng viên ngoài phiếu",()=>{
  const campaign={evaluationMode:"LECTURER",template:{questions:[q]},courseTemplate:{questions:[{...q,id:"subject"}]}};
  const teachers=["t1","t2"].map(lecturerId=>({courseId:"A",lecturerId,course:{code:"A",name:"Môn A"},lecturer:{user:{name:lecturerId}}}));
  const questions=assignedQuestions(campaign,[{courseId:"A",course:{code:"A",name:"Môn A"}}],teachers);
  expect(questions.map(x=>x.id)).toEqual(["common","A:t1:subject","A:t2:subject"]);
  expect(questions[1]).toMatchObject({lecturerId:"t1",sectionTitle:"A · Môn A — t1"});
  expect(validateAnswers(questions,{"A:t3:subject":"5"})).toHaveProperty("A:t3:subject","Câu hỏi không thuộc mẫu khảo sát.");
  expect(assignedQuestions(campaign,[],[...teachers].reverse()).map(q=>q.id)).toEqual(questions.map(q=>q.id));
});
