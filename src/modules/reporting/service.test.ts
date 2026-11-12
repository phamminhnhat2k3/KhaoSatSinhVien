import { expect, test, vi } from "vitest";
import { getCampaignReport } from "./service";

test("báo cáo môn dùng đúng người đánh giá môn đó và chặn nhóm dưới ngưỡng", async () => {
  vi.stubEnv("MIN_REPORT_RESPONSES", "2");
  const q = { id: "q", content: "Điểm", type: "SCALE", scaleMin: 0, scaleMax: 100, options: [] };
  const courseTargets = ["A", "B"].map(courseId => ({ courseId, course: { code: courseId, name: courseId, classes: [{ lecturerId: `teacher-${courseId}`, semesterId: "semester" }] } }));
  const campaign = { id: "c", title: "Khoa",startsAt:new Date("2026-01-01"),endsAt:new Date("2026-02-01"), scope: "FACULTY", facultyId: "faculty-a", status: "CLOSED", semesterId: "semester", faculty: { name: "CNTT" }, targets: [], courseTargets, template: { questions: [{ ...q, id: "common" }] }, courseTemplate: { questions: [q] },
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
    expect(admin.sections.find(s=>s.id==="B")).toMatchObject({responses:1,invited:1});
    campaign.submissions[1].answers[1].value="";
    const optional=await getCampaignReport(db as never,"c");
    expect(optional.questions.find(q=>q.courseId==="A")).toMatchObject({respondents:1,suppressed:true,average:undefined});
    campaign.submissions[1].answers[1].value=" \t\n ";
    const whitespace=await getCampaignReport(db as never,"c");
    expect(whitespace.questions.find(q=>q.courseId==="A")).toMatchObject({respondents:1,suppressed:true,average:undefined});
    campaign.submissions[1].answers[1].value="100";
    const dean = await getCampaignReport(db as never, "c", undefined, "faculty-a");
    expect(dean.questions.map(r => r.courseId)).toEqual([null, "A"]);
    await expect(getCampaignReport(db as never, "c", undefined, "faculty-b")).rejects.toThrow("khoa");
    await expect(getCampaignReport(db as never, "c", "unrelated")).rejects.toThrow("phạm vi");
  } finally { vi.unstubAllEnvs(); }
});
