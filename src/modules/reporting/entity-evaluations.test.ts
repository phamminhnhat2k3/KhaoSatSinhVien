import { beforeEach, expect, test, vi } from "vitest";
const m = vi.hoisted(() => ({ report: vi.fn(), db: { user: { findUnique: vi.fn() }, faculty: { findUnique: vi.fn() }, course: { findUnique: vi.fn() }, surveyParticipation: { count: vi.fn(), findMany: vi.fn() }, surveyCampaign: { count: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() } } }));
vi.mock("./service", () => ({ getCampaignReport: m.report }));
import { getEntityEvaluations } from "./entity-evaluations";
import type { PrismaClient } from "@prisma/client";
const db = m.db as unknown as PrismaClient;
beforeEach(() => { vi.resetAllMocks(); m.db.surveyCampaign.count.mockResolvedValue(0); m.db.surveyCampaign.findMany.mockResolvedValue([]); });

test("sinh viên chỉ đếm phiếu hoàn thành, phân trang và không truy vấn câu trả lời", async () => {
  m.db.user.findUnique.mockResolvedValue({ student: { id: "s" }, lecturer: null });
  m.db.surveyParticipation.count.mockResolvedValue(12);
  m.db.surveyParticipation.findMany.mockResolvedValue([{ id: "p", completedAt: new Date("2026-11-01"), campaign: { title: "Đánh giá", semester: { name: "HK1" } } }]);
  const result = await getEntityEvaluations(db, "user", "u", 99, "ignored");
  expect(result).toMatchObject({ kind: "student", total: 12, page: 2, pages: 2, report: null });
  const query = m.db.surveyParticipation.findMany.mock.calls[0][0];
  expect(query).toMatchObject({ where: { studentId: "s", status: "COMPLETED" }, skip: 10, take: 10 });
  expect(JSON.stringify(query)).not.toMatch(/draft|answers|submission/i);
  expect(m.report).not.toHaveBeenCalled();
});

test("đánh giá cá nhân giảng viên lấy phân công đã chốt và chặn đợt không liên quan", async () => {
  m.db.user.findUnique.mockResolvedValue({ student: null, lecturer: { id: "teacher" } });
  m.db.surveyCampaign.findFirst.mockResolvedValue(null);
  await expect(getEntityEvaluations(db, "user", "u", 1, "other")).rejects.toThrow("phạm vi");
  expect(m.db.surveyCampaign.count.mock.calls[0][0].where).toMatchObject({ evaluationMode: "LECTURER", participations: { some: { teachings: { some: { lecturerId: "teacher" } } } } });
  expect(m.report).not.toHaveBeenCalled();
  m.db.surveyCampaign.findFirst.mockResolvedValue({ id: "c" });
  m.report.mockRejectedValue(new Error("Cần tối thiểu 5 phản hồi"));
  await expect(getEntityEvaluations(db, "user", "u", 1, "c")).rejects.toThrow("5 phản hồi");
  expect(m.report).toHaveBeenCalledWith(db, "c", "teacher", undefined);
});

test("môn chỉ trả phần của môn đó, khoa dùng đúng phạm vi khoa", async () => {
  m.db.course.findUnique.mockResolvedValue({ id: "course" });
  m.db.faculty.findUnique.mockResolvedValue({ id: "faculty" });
  m.db.surveyCampaign.findFirst.mockResolvedValue({ id: "c" });
  m.report.mockResolvedValue({ questions: [{ courseId: "course" }, { courseId: "other" }, { courseId: null }], sections: [{ id: "course:t" }, { id: "other:t" }, { id: "common" }] });
  const result = await getEntityEvaluations(db, "course", "course", 1, "c");
  expect(result.report?.questions).toEqual([{ courseId: "course" }]);
  expect(result.report?.sections).toEqual([{ id: "course:t" }]);
  await getEntityEvaluations(db, "faculty", "faculty", 1, "c");
  expect(m.report).toHaveBeenLastCalledWith(db, "c", undefined, "faculty");
});

test("đối tượng đã xóa báo lỗi, Admin không có lịch sử giả", async () => {
  m.db.user.findUnique.mockResolvedValue(null);
  await expect(getEntityEvaluations(db, "user", "gone", 1)).rejects.toThrow("Không tìm thấy");
  m.db.user.findUnique.mockResolvedValue({ student: null, lecturer: null });
  expect(await getEntityEvaluations(db, "user", "admin", 1)).toMatchObject({ kind: "other", total: 0 });
  expect(m.db.surveyParticipation.count).not.toHaveBeenCalled();
});
test("Trưởng khoa chỉ xem lịch sử sinh viên của khoa và không xem khảo sát ngoài khoa", async () => {
  m.db.user.findUnique.mockResolvedValue({ student: { id: "s", academicClass: { facultyId: "other" } }, lecturer: null });
  await expect(getEntityEvaluations(db, "user", "u", 1, undefined, "own")).rejects.toThrow("trong khoa");
  expect(m.db.surveyParticipation.count).not.toHaveBeenCalled();
  m.db.user.findUnique.mockResolvedValue({ student: { id: "s", academicClass: { facultyId: "own" } }, lecturer: null });
  m.db.surveyParticipation.count.mockResolvedValue(0); m.db.surveyParticipation.findMany.mockResolvedValue([]);
  expect(await getEntityEvaluations(db, "user", "u", 1, undefined, "own")).toMatchObject({ facultyOnly: true, total: 0 });
  expect(m.db.surveyParticipation.count).toHaveBeenCalledWith({ where: { studentId: "s", status: "COMPLETED", campaign: { scope: "FACULTY", facultyId: "own" } } });
});
test("Trưởng khoa không xem điểm giảng viên trong đợt ngoài khoa dù có phân công", async () => {
  m.db.user.findUnique.mockResolvedValue({ student: null, lecturer: { id: "teacher", facultyId: "own" } });
  m.db.surveyCampaign.findFirst.mockResolvedValue(null);
  await expect(getEntityEvaluations(db, "user", "u", 1, "foreign", "own")).rejects.toThrow("phạm vi");
  expect(m.db.surveyCampaign.findFirst.mock.calls[0][0].where).toMatchObject({ id: "foreign", scope: "FACULTY", facultyId: "own" });
});
test("Trưởng khoa không mở khoa hoặc môn của khoa khác", async () => {
  await expect(getEntityEvaluations(db, "faculty", "other", 1, undefined, "own")).rejects.toThrow("trong khoa");
  m.db.course.findUnique.mockResolvedValue({ id: "course", facultyId: "other" });
  await expect(getEntityEvaluations(db, "course", "course", 1, undefined, "own")).rejects.toThrow("trong khoa");
  expect(m.db.surveyCampaign.count).not.toHaveBeenCalled();
});
