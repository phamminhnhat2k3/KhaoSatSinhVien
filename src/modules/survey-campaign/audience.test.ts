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
    surveyCampaign: { update: vi.fn().mockResolvedValue({ id: "c", scope: "FACULTY", facultyId: "f", semesterId: "s", courseTargets: [{ courseId: "A" }, { courseId: "B" }] }) },
    studentProfile: { findMany: vi.fn().mockResolvedValue([{ id: "s1", enrollments: [{ class: { courseId: "A" } }, { class: { courseId: "A" } }, { class: { courseId: "B" } }] }, { id: "s2", enrollments: [{ class: { courseId: "A" } }] }]) },
    surveyParticipation: { createMany: vi.fn(), findMany: vi.fn().mockResolvedValue([{ id: "p1", studentId: "s1" }, { id: "p2", studentId: "s2" }]) }, participationCourse: { createMany: vi.fn() }
  };
  await publishToAudience(tx as never, "c");
  expect(tx.surveyCampaign.update.mock.calls[0][0].where).toEqual({ id: "c", status: "DRAFT" });
  expect(tx.participationCourse.createMany).toHaveBeenCalledWith({ data: [{ participationId: "p1", courseId: "A" }, { participationId: "p1", courseId: "B" }, { participationId: "p2", courseId: "A" }] });
});
