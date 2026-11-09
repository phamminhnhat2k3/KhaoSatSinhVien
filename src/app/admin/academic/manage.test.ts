import { beforeEach, expect, test, vi } from "vitest";

const { tx, requireUser } = vi.hoisted(() => ({
  tx: {
    semester: { findUniqueOrThrow: vi.fn(), update: vi.fn(), delete: vi.fn() },
    academicClass: { findUniqueOrThrow: vi.fn(), update: vi.fn(), delete: vi.fn() },
    course: { findUniqueOrThrow: vi.fn(), update: vi.fn(), delete: vi.fn() },
    courseClass: { findUniqueOrThrow: vi.fn(), update: vi.fn(), delete: vi.fn() },
    classStudyAssignment: { count: vi.fn() }, enrollment: { count: vi.fn() }, auditLog: { create: vi.fn() },
  }, requireUser: vi.fn(),
}));
vi.mock("@/lib/access", () => ({ requireUser }));
vi.mock("@/lib/db", () => ({ db: { $transaction: (run: (client: typeof tx) => unknown) => run(tx) } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { manageAcademic } from "./manage";

function form(kind: string, values: Record<string, string> = {}) { const f = new FormData(); for (const [k, v] of Object.entries({ id: "item", kind, operation: "update", ...values })) f.set(k, v); return f; }
const dates = { name: "Học kỳ mới", startsAt: "2026-01-01", endsAt: "2026-06-01" };
const counts = { classes: 0, campaigns: 0, studentStudyPlans: 0, students: 0, studyAssignments: 0, campaignTargets: 0, lecturers: 0, assignments: 0, teachingEvaluations: 0, answers: 0, enrollments: 0, academicAssignments: 0, targets: 0, teachings: 0 };
const group = { code: "CQ01", name: "Lớp mới", facultyId: "faculty", educationSystem: "REGULAR" };
const section = { code: "MH01", courseId: "course", semesterId: "semester", educationSystem: "REGULAR", capacity: "30" };
beforeEach(() => {
  vi.resetAllMocks(); requireUser.mockResolvedValue({ id: "admin" });
  tx.semester.findUniqueOrThrow.mockResolvedValue({ startsAt: new Date("2025-12-31T17:00:00Z"), endsAt: new Date("2026-06-01T16:59:59.999Z"), _count: counts });
  tx.academicClass.findUniqueOrThrow.mockResolvedValue({ ...group, _count: counts });
  tx.course.findUniqueOrThrow.mockResolvedValue({ facultyId: "faculty", _count: counts });
  tx.courseClass.findUniqueOrThrow.mockResolvedValue({ ...section, lecturerId: null, _count: counts });
  tx.classStudyAssignment.count.mockResolvedValue(0); tx.enrollment.count.mockResolvedValue(0);
});

test.each(["Semester", "AcademicClass", "Course", "CourseClass"])("xóa %s chưa dùng, yêu cầu Admin và ghi nhật ký", async kind => {
  expect(await manageAcademic(undefined, form(kind, { operation: "delete" }))).toBe("Đã xóa danh mục.");
  expect(requireUser).toHaveBeenCalledWith("ADMIN");
  expect(tx.auditLog.create).toHaveBeenCalledWith({ data: { actorId: "admin", action: "DELETE", entity: kind, entityId: "item" } });
});
test.each([
  ["Semester", "semester", "studentStudyPlans"], ["AcademicClass", "academicClass", "campaignTargets"],
  ["Course", "course", "answers"], ["CourseClass", "courseClass", "academicAssignments"],
] as const)("chặn xóa %s còn dữ liệu phụ thuộc kể cả quan hệ cascade", async (kind, model, relation) => {
  tx[model].findUniqueOrThrow.mockResolvedValue({ _count: { ...counts, [relation]: 1 } });
  expect(await manageAcademic(undefined, form(kind, { operation: "delete" }))).toMatch(/^Không thể xóa/);
  expect(tx[model].delete).not.toHaveBeenCalled(); expect(tx.auditLog.create).not.toHaveBeenCalled();
});
test("học kỳ đã dùng sửa tên được nhưng không đổi thời gian, ngày VN giữ đúng", async () => {
  tx.semester.findUniqueOrThrow.mockResolvedValue({ startsAt: new Date("2025-12-31T17:00:00Z"), endsAt: new Date("2026-06-01T16:59:59.999Z"), _count: { classes: 1 } });
  expect(await manageAcademic(undefined, form("Semester", dates))).toBe("Đã cập nhật danh mục.");
  expect(tx.semester.update).toHaveBeenCalledWith({ where: { id: "item" }, data: { name: dates.name, startsAt: new Date("2025-12-31T17:00:00Z"), endsAt: new Date("2026-06-01T16:59:59.999Z") } });
  tx.semester.update.mockClear();
  expect(await manageAcademic(undefined, form("Semester", { ...dates, endsAt: "2026-08-01" }))).toContain("Không thể đổi thời gian");
  expect(tx.semester.update).not.toHaveBeenCalled();
});
test("kiểm tra ngày đảo ngược và sĩ số không hợp lệ ở máy chủ", async () => {
  expect(await manageAcademic(undefined, form("Semester", { ...dates, endsAt: "2025-01-01" }))).toContain("Kiểm tra");
  expect(await manageAcademic(undefined, form("CourseClass", { ...section, capacity: "-1" }))).toContain("Kiểm tra");
  expect(tx.semester.update).not.toHaveBeenCalled(); expect(tx.courseClass.update).not.toHaveBeenCalled();
});
test("lớp hành chính giữ khoa khi có sinh viên và không đổi hệ lệch phân công hiện tại", async () => {
  tx.academicClass.findUniqueOrThrow.mockResolvedValue({ ...group, _count: { students: 1 } });
  expect(await manageAcademic(undefined, form("AcademicClass", { ...group, facultyId: "other" }))).toContain("Không thể đổi khoa");
  tx.classStudyAssignment.count.mockResolvedValue(1);
  expect(await manageAcademic(undefined, form("AcademicClass", { ...group, educationSystem: "PART_TIME" }))).toContain("Không thể đổi hệ học");
  expect(tx.academicClass.update).not.toHaveBeenCalled();
  expect(tx.classStudyAssignment.count.mock.calls[0][0].where.class.semester.endsAt.gte).toBeInstanceOf(Date);
});
test("môn đã dùng chỉ đổi mã tên, không chuyển khoa", async () => {
  tx.course.findUniqueOrThrow.mockResolvedValue({ facultyId: "faculty", _count: { assignments: 1 } });
  expect(await manageAcademic(undefined, form("Course", { code: "mh02", name: "Môn học mới", facultyId: "faculty" }))).toBe("Đã cập nhật danh mục.");
  expect(tx.course.update).toHaveBeenCalledWith({ where: { id: "item" }, data: { code: "MH02", name: "Môn học mới", facultyId: "faculty" } });
  tx.course.update.mockClear();
  expect(await manageAcademic(undefined, form("Course", { code: "MH02", name: "Môn học mới", facultyId: "other" }))).toContain("Không thể đổi khoa");
  expect(tx.course.update).not.toHaveBeenCalled();
});
test("lớp học phần giữ phân công và không giảm sĩ số dưới số đã ghi danh", async () => {
  tx.courseClass.findUniqueOrThrow.mockResolvedValue({ ...section, _count: { ...counts, enrollments: 10 } });
  expect(await manageAcademic(undefined, form("CourseClass", { ...section, semesterId: "other" }))).toContain("Không thể đổi môn");
  expect(await manageAcademic(undefined, form("CourseClass", { ...section, capacity: "5" }))).toContain("Không thể giảm sĩ số");
  expect(await manageAcademic(undefined, form("CourseClass", { ...section, capacity: "35" }))).toBe("Đã cập nhật danh mục.");
});
test("không nhận kiểu đối tượng hoặc thao tác giả mạo, không nuốt lỗi quyền truy cập", async () => {
  expect(await manageAcademic(undefined, form("User", { operation: "delete" }))).toContain("không hợp lệ");
  expect(tx.auditLog.create).not.toHaveBeenCalled();
  requireUser.mockRejectedValue(new Error("redirect"));
  await expect(manageAcademic(undefined, form("Course"))).rejects.toThrow("redirect");
});
