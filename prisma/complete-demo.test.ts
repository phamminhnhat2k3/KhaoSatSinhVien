import { expect, test, vi } from "vitest";
import { completeClasses, completeCourses, completeExceptions, completeFaculties, completeGroups, completeSemesters, completeStudents, completeTeachers, completeTemplates, demoAnswerValues } from "./complete-demo-data";
import { completeDemoGuide } from "./complete-demo-guide";
import { resetCompleteDemo } from "./complete-demo-service";
import { templateSchema } from "../src/modules/templates/rules";
import { validateAnswers } from "../src/modules/response/rules";

test("đủ 5 khoa, 15 lớp, 75 sinh viên và 20 giảng viên gồm 5 trưởng khoa", () => {
  expect(completeFaculties).toHaveLength(5); expect(completeClasses).toHaveLength(15); expect(completeStudents).toHaveLength(75); expect(completeTeachers).toHaveLength(20);
  expect(completeTeachers.filter(t => t.dean)).toHaveLength(5);
  expect(new Set([...completeStudents, ...completeTeachers].map(a => a.email)).size).toBe(95);
  for (const faculty of completeFaculties) {
    const classes = completeClasses.filter(c => c.facultyId === faculty.id);
    expect(new Set(classes.map(c => c.educationSystem))).toEqual(new Set(["REGULAR", "PART_TIME", "DISTANCE"]));
    for (const group of classes) expect(completeStudents.filter(s => s.academicClassId === group.id)).toHaveLength(5);
  }
});
test("mỗi lớp học đúng 4 môn trong mỗi học kỳ, mọi nhóm được phân công giảng viên cùng khoa", () => {
  expect(completeSemesters).toHaveLength(2); expect(completeCourses).toHaveLength(40); expect(completeGroups).toHaveLength(120);
  for (const home of completeClasses) for (const semester of completeSemesters) {
    const groups = completeGroups.filter(g => g.academicClassId === home.id && g.semesterId === semester.id);
    expect(groups).toHaveLength(4); expect(new Set(groups.map(g => g.courseId)).size).toBe(4);
    for (const g of groups) {
      expect(g.educationSystem).toBe(home.educationSystem);
      expect(completeTeachers.find(t => t.profileId === g.lecturerId)?.facultyId).toBe(home.facultyId);
    }
  }
  for (const teacher of completeTeachers) expect(completeGroups.filter(g => g.lecturerId === teacher.profileId).length).toBeGreaterThan(1);
});
test("hai ngoại lệ chỉ đổi giảng viên một môn ở HK1 và vẫn học đúng 4 môn", () => {
  expect(completeExceptions).toHaveLength(2);
  for (const e of completeExceptions) {
    const original = completeGroups.find(g => g.id === e.originalId)!;
    expect(e.alternate.courseId).toBe(original.courseId); expect(e.alternate.lecturerId).not.toBe(original.lecturerId);
    expect(e.alternate.educationSystem).toBe(original.educationSystem);
    expect(e.classIds).toHaveLength(4); expect(e.classIds).not.toContain(e.originalId); expect(e.classIds).toContain(e.alternate.id);
    expect(e.semesterId).toBe(completeSemesters[1].id);
  }
});
test("mẫu thực tế đủ bốn dạng câu hỏi và thang 5/10/100, trả lời mô phỏng hợp lệ", () => {
  expect(completeTemplates).toHaveLength(5);
  const types = new Set<string>();
  for (const template of completeTemplates) {
    const parsed = templateSchema.parse(template);
    const questions = parsed.questions.map((q, i) => ({ ...q, id: `q${i}`, optionValues: q.options.map(o => o.value) }));
    for (const q of questions) types.add(q.type);
    for (let i = 0; i < 15; i++) expect(validateAnswers(questions, demoAnswerValues(questions, i))).toEqual({});
    expect(questions.filter(q => q.type === "TEXT").every(q => !q.required)).toBe(true);
  }
  expect(types).toEqual(new Set(["SCALE", "SINGLE", "MULTIPLE", "TEXT"]));
  expect(new Set(completeTemplates.flatMap(t => t.questions.filter(q => q.type === "SCALE").map(q => q.scaleMax)))).toEqual(new Set([5, 10, 100]));
});
test("hướng dẫn công khai tài khoản demo nhưng không công khai Admin", () => {
  const guide = completeDemoGuide([{ email: "admin@demo.vn", name: "Admin" }], []);
  expect(guide).not.toContain("admin@demo.vn");
  for (const account of [...completeStudents, ...completeTeachers]) expect(guide).toContain(`| ${account.email} | vitrung65 |`);
  for (const group of completeGroups) expect(guide).toContain(group.code);
  expect(guide).toContain("75 sinh viên");
});
test("thiếu Admin đang hoạt động phải dừng trước khi xóa dữ liệu", async () => {
  const db = { user: { findMany: vi.fn().mockResolvedValue([]) }, $transaction: vi.fn() };
  await expect(resetCompleteDemo(db as never, new Map())).rejects.toThrow("Admin đang hoạt động");
  expect(db.$transaction).not.toHaveBeenCalled();
});
