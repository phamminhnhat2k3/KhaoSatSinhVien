import { beforeEach, expect, test, vi } from "vitest";

const { tx, requireUser } = vi.hoisted(() => ({
  tx: { academicClass: { create: vi.fn(), update: vi.fn() }, classStudyAssignment: { count: vi.fn() }, enrollment: { count: vi.fn() }, auditLog: { create: vi.fn() } },
  requireUser: vi.fn()
}));
vi.mock("@/lib/access", () => ({ requireUser }));
vi.mock("@/lib/db", () => ({ db: { $transaction: (run: (client: typeof tx) => unknown) => run(tx) } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { createAcademicClass, updateClassEducation } from "./actions";

beforeEach(() => { vi.clearAllMocks(); requireUser.mockResolvedValue({ id: "admin" }); tx.academicClass.create.mockResolvedValue({ id: "home" }); tx.classStudyAssignment.count.mockResolvedValue(0); tx.enrollment.count.mockResolvedValue(0); });
const form = (data: Record<string, string>) => { const result = new FormData(); for (const [key, value] of Object.entries(data)) result.set(key, value); return result; };

test("tạo lớp lưu hệ học được chọn và chặn giá trị hệ học giả mạo", async () => {
  const input = { code: "CNTT01", name: "Lớp CNTT01", facultyId: "f", educationSystem: "PART_TIME" };
  expect(await createAcademicClass(undefined, form(input))).toBe("Đã tạo lớp hành chính.");
  expect(tx.academicClass.create).toHaveBeenCalledWith({ data: input });
  tx.academicClass.create.mockClear();
  await createAcademicClass(undefined, form({ ...input, educationSystem: "OTHER" }));
  expect(tx.academicClass.create).not.toHaveBeenCalled();
});
test("đổi hệ học chỉ cập nhật cột hệ học, giữ mã tên lớp và ghi nhật ký Admin", async () => {
  expect(await updateClassEducation(undefined, form({ id: "home", educationSystem: "DISTANCE", code: "OVERWRITE" }))).toBe("Đã cập nhật hệ học của lớp hành chính.");
  expect(requireUser).toHaveBeenCalledWith("ADMIN");
  expect(tx.academicClass.update).toHaveBeenCalledWith({ where: { id: "home" }, data: { educationSystem: "DISTANCE" } });
  expect(tx.auditLog.create).toHaveBeenCalledWith({ data: { actorId: "admin", action: "UPDATE_EDUCATION_SYSTEM", entity: "AcademicClass", entityId: "home" } });
  tx.academicClass.update.mockClear();
  await updateClassEducation(undefined, form({ id: "home", educationSystem: "OTHER" }));
  expect(tx.academicClass.update).not.toHaveBeenCalled();
});
test("không đổi hệ khi phân công chưa kết thúc còn thuộc hệ khác", async () => {
  tx.classStudyAssignment.count.mockResolvedValue(1);
  expect(await updateClassEducation(undefined, form({ id: "home", educationSystem: "DISTANCE" }))).toContain("không khớp hệ học mới");
  expect(tx.academicClass.update).not.toHaveBeenCalled();
  expect(tx.classStudyAssignment.count.mock.calls[0][0].where.class.semester.endsAt.gte).toBeInstanceOf(Date);
});
