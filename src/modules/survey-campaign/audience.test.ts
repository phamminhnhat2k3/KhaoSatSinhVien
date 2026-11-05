import { expect, test, vi } from "vitest";
import { getAudience, publishToAudience } from "./audience";

test("phạm vi toàn trường không lọc khoa, theo khoa dùng lớp hành chính và đăng ký đúng học kỳ", async () => {
  const tx = { studentProfile: { findMany: vi.fn().mockResolvedValue([]) } };
  const campaign = { id: "c", scope: "UNIVERSITY", facultyId: null, semesterId: "s", courseTargets: [] };
  await getAudience(tx as never, campaign);
  expect(tx.studentProfile.findMany.mock.calls[0][0].where).not.toHaveProperty("academicClass");
  await getAudience(tx as never, { ...campaign, academicTargets:[{academicClassId:"home"}], scope: "FACULTY", facultyId: "f", courseTargets: [{ courseId: "A" }] });
  const query = tx.studentProfile.findMany.mock.calls[1][0];
  expect(query.where.academicClass).toEqual({ facultyId: "f", id:{in:["home"]} });
  expect(query.where.user.active).toBe(true);
  expect(query.select.enrollments.where.class).toEqual({ semesterId: "s", courseId: { in: ["A"] } });
});
test("công bố chốt môn theo từng sinh viên, học hai lớp cùng môn vẫn chỉ một phần đánh giá", async () => {
  const tx = {
    academicClass:{count:vi.fn().mockResolvedValue(1)},
    course: { count: vi.fn().mockResolvedValue(2) },
    surveyCampaign: { update: vi.fn().mockResolvedValue({ id: "c", academicTargets:[{academicClassId:"home"}], scope: "FACULTY", facultyId: "f", semesterId: "s", courseTargets: [{ courseId: "A" }, { courseId: "B" }] }) },
    studentProfile: { findMany: vi.fn().mockResolvedValue([{ id: "s1", enrollments: [{ class: { id:"gA",courseId: "A" } }, { class: { id:"gA",courseId: "A" } }, { class: { id:"gB",courseId: "B" } }] }, { id: "s2", enrollments: [{ class: { id:"gA",courseId: "A" } }] }]) },
    surveyParticipation: { createMany: vi.fn(), findMany: vi.fn().mockResolvedValue([{ id: "p1", studentId: "s1" }, { id: "p2", studentId: "s2" }]) }, participationCourse: { createMany: vi.fn() }
  };
  await publishToAudience(tx as never, "c");
  expect(tx.surveyCampaign.update.mock.calls[0][0].where).toEqual({ id: "c", status: "DRAFT" });
  expect(tx.participationCourse.createMany).toHaveBeenCalledWith({ data: [{ participationId: "p1", courseId: "A" }, { participationId: "p1", courseId: "B" }, { participationId: "p2", courseId: "A" }] });
  expect(tx.course.count).toHaveBeenCalledWith({ where: { id: { in: ["A","B"] }, facultyId:"f", classes:{some:{semesterId:"s"}} } });
});

test("không mở rộng người nhận khi thiếu khoa, học kỳ hoặc sai phạm vi",async()=>{
  const tx={studentProfile:{findMany:vi.fn()}};
  const campaign={id:"c",academicTargets:[{academicClassId:"home"}],scope:"FACULTY",facultyId:"f",semesterId:"s",courseTargets:[]};
  for(const invalid of [{facultyId:null},{semesterId:null},{scope:"OTHER"},{scope:"UNIVERSITY",courseTargets:[{courseId:"A"}]}]){
    await expect(getAudience(tx as never,{...campaign,...invalid})).rejects.toThrow("không hợp lệ");
  }
  expect(tx.studentProfile.findMany).not.toHaveBeenCalled();
});

test("chặn công bố bản nháp nếu môn đã chuyển khoa hoặc không còn trong học kỳ",async()=>{
  const tx={academicClass:{count:vi.fn().mockResolvedValue(1)},surveyCampaign:{update:vi.fn().mockResolvedValue({id:"c",academicTargets:[{academicClassId:"home"}],scope:"FACULTY",facultyId:"f",semesterId:"s",courseTargets:[{courseId:"A"}]})},course:{count:vi.fn().mockResolvedValue(0)},studentProfile:{findMany:vi.fn()},surveyParticipation:{createMany:vi.fn()}};
  await expect(publishToAudience(tx as never,"c")).rejects.toThrow("Môn học đã thay đổi");
  expect(tx.studentProfile.findMany).not.toHaveBeenCalled();
  expect(tx.surveyParticipation.createMany).not.toHaveBeenCalled();
});

test("phiếu dùng phân công chung, riêng ghi đè kể cả miễn toàn bộ môn",async()=>{
 const campaign={id:"c",scope:"FACULTY",facultyId:"f",semesterId:"s",academicTargets:[{academicClassId:"home"}],courseTargets:[{courseId:"A"}]};
 const shared={class:{id:"A",courseId:"A"}},personal={class:{id:"B",courseId:"B"}};
 const tx={studentProfile:{findMany:vi.fn().mockResolvedValue([
  {id:"normal",academicClass:{studyAssignments:[shared]},enrollments:[],studyPlans:[]},
  {id:"special",academicClass:{studyAssignments:[shared]},enrollments:[personal],studyPlans:[{semesterId:"s"}]},
  {id:"exempt",academicClass:{studyAssignments:[shared]},enrollments:[],studyPlans:[{semesterId:"s"}]}
 ])}};
 const result=await getAudience(tx as never,campaign);
 expect(result.map(s=>s.enrollments)).toEqual([[shared],[personal],[]]);
 expect(tx.studentProfile.findMany.mock.calls[0][0].select.academicClass.select.studyAssignments.where.class).toEqual({semesterId:"s",courseId:{in:["A"]}});
});
test("bản nháp chưa chọn lớp không được mở rộng ra toàn khoa",async()=>{
 const tx={studentProfile:{findMany:vi.fn()}};
 expect(await getAudience(tx as never,{id:"c",scope:"FACULTY",facultyId:"f",semesterId:"s",courseTargets:[]})).toEqual([]);
 expect(tx.studentProfile.findMany).not.toHaveBeenCalled();
});
