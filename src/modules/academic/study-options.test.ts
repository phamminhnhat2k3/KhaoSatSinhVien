import { expect, test } from "vitest";
import { groupStudyCourses, studyGroupOption } from "./study-options";

const teacher = { facultyId: "f", user: { name: "Thầy A", active: true } };
const group = { id: "g1", code: "CNTT105-1", semesterId: "s", educationSystem: "REGULAR", courseId: "A", course: { code: "CNTT105", name: "Mạng máy tính", facultyId: "f" }, teachingConfigured: true, lecturer: null, teachings: [{ lecturer: teacher }] };
test("mỗi môn chỉ một dòng lựa chọn dù có nhiều nhóm/người dạy", () => {
  const rows = groupStudyCourses([studyGroupOption(group), studyGroupOption({ ...group, id: "g2", teachings: [{ lecturer: { ...teacher, user: { ...teacher.user, name: "Cô B" } } }] })]);
  expect(rows).toHaveLength(1); expect(rows[0].groups).toHaveLength(2);
  expect(rows[0].groups.map(g => g.teacherName)).toEqual(["Thầy A", "Cô B"]);
  expect(rows[0].name).toBe("Mạng máy tính");
});
test("không cho chọn nhóm thiếu người dạy, đồng giảng cũ, khác khoa hoặc đã khóa", () => {
  expect(studyGroupOption(group).eligible).toBe(true);
  expect(studyGroupOption({ ...group, teachings: [] }).eligible).toBe(false);
  expect(studyGroupOption({ ...group, teachings: [{ lecturer: teacher }, { lecturer: teacher }] }).eligible).toBe(false);
  expect(studyGroupOption({ ...group, teachings: [{ lecturer: { ...teacher, facultyId: "other" } }] }).eligible).toBe(false);
  expect(studyGroupOption({ ...group, teachings: [{ lecturer: { ...teacher, user: { ...teacher.user, active: false } } }] }).eligible).toBe(false);
  expect(studyGroupOption({ ...group, teachingConfigured: false, teachings: [], lecturer: teacher }).eligible).toBe(true);
});
