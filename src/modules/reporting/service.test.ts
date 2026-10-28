import { expect, test, vi } from "vitest";
import { getCampaignReport } from "./service";

test("báo cáo môn dùng đúng người đánh giá môn đó và chặn nhóm dưới ngưỡng", async () => {
  vi.stubEnv("MIN_REPORT_RESPONSES", "2");
  const q = { id: "q", content: "Điểm", type: "SCALE", scaleMin: 0, scaleMax: 100, options: [] };
  const courseTargets = ["A", "B"].map(courseId => ({ courseId, course: { code: courseId, name: courseId, classes: [{ lecturerId: `teacher-${courseId}`, semesterId: "semester" }] } }));
  const campaign = { id: "c", title: "Khoa", scope: "FACULTY", status: "CLOSED", semesterId: "semester", faculty: { name: "CNTT" }, targets: [], courseTargets, template: { questions: [{ ...q, id: "common" }] }, courseTemplate: { questions: [q] },
    participations: [{ status: "COMPLETED", courses: [{ courseId: "A" }, { courseId: "B" }] }, { status: "COMPLETED", courses: [{ courseId: "A" }] }],
    submissions: [{ answers: [{ questionId: "common", courseId: null, value: "50" }, { questionId: "q", courseId: "A", value: "80" }, { questionId: "q", courseId: "B", value: "20" }] }, { answers: [{ questionId: "common", courseId: null, value: "70" }, { questionId: "q", courseId: "A", value: "100" }] }]
  };
  const db = { surveyCampaign: { findUnique: vi.fn().mockResolvedValue(campaign) } };
  try {
    const report = await getCampaignReport(db as never, "c", "teacher-A");
    expect(report.questions).toHaveLength(1);
    expect(report.questions[0]).toMatchObject({ courseId: "A", average: 90, respondents: 2, invited: 2 });
    await expect(getCampaignReport(db as never, "c", "teacher-B")).rejects.toThrow("tối thiểu 2");
    const admin = await getCampaignReport(db as never, "c");
    expect(admin.questions.map(r => r.courseId)).toEqual([null, "A"]);
    await expect(getCampaignReport(db as never, "c", "unrelated")).rejects.toThrow("phạm vi");
  } finally { vi.unstubAllEnvs(); }
});
