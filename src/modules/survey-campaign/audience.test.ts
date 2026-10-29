import { expect, test, vi } from "vitest";
import { getAudience, publishToAudience } from "./audience";

test("phạm vi toàn trường không lọc khoa, theo khoa dùng lớp hành chính và đăng ký đúng học kỳ", async () => {
  const tx = { studentProfile: { findMany: vi.fn().mockResolvedValue([]) } };
  const campaign = { id: "c", scope: "UNIVERSITY", facultyId: null, semesterId: "s", courseTargets: [] };
  await getAudience(tx as never, campaign);
  expect(tx.studentProfile.findMany.mock.calls[0][0].where).not.toHaveProperty("academicClass");
  await getAudience(tx as never, { ...campaign, scope: "FACULTY", facultyId: "f", courseTargets: [{ courseId: "A" }] });
  const query = tx.studentProfile.findMany.mock.calls[1][0];
  expect(query.where.academicClass).toEqual({ facultyId: "f" });
  expect(query.where.user.active).toBe(true);
  expect(query.select.enrollments.where.class).toEqual({ semesterId: "s", courseId: { in: ["A"] } });
});
test("công bố chốt môn theo từng sinh viên, học hai lớp cùng môn vẫn chỉ một phần đánh giá", async () => {
  const tx = {
    course: { count: vi.fn().mockResolvedValue(2) },
    surveyCampaign: { update: vi.fn().mockResolvedValue({ id: "c", scope: "FACULTY", facultyId: "f", semesterId: "s", courseTargets: [{ courseId: "A" }, { courseId: "B" }] }) },
    studentProfile: { findMany: vi.fn().mockResolvedValue([{ id: "s1", enrollments: [{ class: { courseId: "A" } }, { class: { courseId: "A" } }, { class: { courseId: "B" } }] }, { id: "s2", enrollments: [{ class: { courseId: "A" } }] }]) },
    surveyParticipation: { createMany: vi.fn(), findMany: vi.fn().mockResolvedValue([{ id: "p1", studentId: "s1" }, { id: "p2", studentId: "s2" }]) }, participationCourse: { createMany: vi.fn() }
  };
  await publishToAudience(tx as never, "c");
  expect(tx.surveyCampaign.update.mock.calls[0][0].where).toEqual({ id: "c", status: "DRAFT" });
  expect(tx.participationCourse.createMany).toHaveBeenCalledWith({ data: [{ participationId: "p1", courseId: "A" }, { participationId: "p1", courseId: "B" }, { participationId: "p2", courseId: "A" }] });
  expect(tx.course.count).toHaveBeenCalledWith({ where: { id: { in: ["A","B"] }, facultyId:"f", classes:{some:{semesterId:"s"}} } });
});

test("không mở rộng người nhận khi thiếu khoa, học kỳ hoặc sai phạm vi",async()=>{
  const tx={studentProfile:{findMany:vi.fn()}};
  const campaign={id:"c",scope:"FACULTY",facultyId:"f",semesterId:"s",courseTargets:[]};
  for(const invalid of [{facultyId:null},{semesterId:null},{scope:"OTHER"},{scope:"UNIVERSITY",courseTargets:[{courseId:"A"}]}]){
    await expect(getAudience(tx as never,{...campaign,...invalid})).rejects.toThrow("không hợp lệ");
  }
  expect(tx.studentProfile.findMany).not.toHaveBeenCalled();
});

test("chặn công bố bản nháp nếu môn đã chuyển khoa hoặc không còn trong học kỳ",async()=>{
  const tx={surveyCampaign:{update:vi.fn().mockResolvedValue({id:"c",scope:"FACULTY",facultyId:"f",semesterId:"s",courseTargets:[{courseId:"A"}]})},course:{count:vi.fn().mockResolvedValue(0)},studentProfile:{findMany:vi.fn()},surveyParticipation:{createMany:vi.fn()}};
  await expect(publishToAudience(tx as never,"c")).rejects.toThrow("Môn học đã thay đổi");
  expect(tx.studentProfile.findMany).not.toHaveBeenCalled();
  expect(tx.surveyParticipation.createMany).not.toHaveBeenCalled();
});
