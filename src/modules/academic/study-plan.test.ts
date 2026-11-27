import { expect, test, vi } from "vitest";
import { effectiveEnrollments, saveClassStudyPlan, saveStudentStudyPlan, addStudentEnrollments, checkStudentPlacement } from "./study-plan";

const group = (id: string) => ({ class: { id } });
const teacher = {facultyId:"f",user:{active:true,roles:[{role:"LECTURER"}]}};
const studyGroup = (id="g",courseId="A") => ({id,courseId,teachingConfigured:true,lecturer:null,teachings:[{lecturer:teacher}]});
test("phân công chung, đăng ký bổ sung, miễn môn và danh sách riêng rỗng", () => {
  expect(effectiveEnrollments([group("A"), group("B")], [group("B"), group("C")], false)).toEqual([group("A"), group("B"), group("C")]);
  expect(effectiveEnrollments([group("A"), group("B")], [group("D")], true)).toEqual([group("D")]);
  expect(effectiveEnrollments([group("A")], [], true)).toEqual([]);
});

function database() {
  return {
    semester: { findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "s" }) },
    academicClass: { findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "home", facultyId: "f", educationSystem:"REGULAR" }) },
    courseClass: { findMany: vi.fn().mockResolvedValue([studyGroup()]) },
    classStudyAssignment: { deleteMany: vi.fn(), createMany: vi.fn() },
    studentProfile: { findUniqueOrThrow: vi.fn().mockResolvedValue({ academicClass: { facultyId: "f", educationSystem:"REGULAR" } }) },
    enrollment: { findFirst: vi.fn().mockResolvedValue(null), deleteMany: vi.fn(), createMany: vi.fn() },
    studentStudyPlan: { deleteMany: vi.fn(), create: vi.fn() },
    auditLog: { create: vi.fn() }
  };
}
test("lưu chung chỉ thay phân công của đúng lớp và học kỳ, không sửa phiếu cũ", async () => {
  const tx = database();
  await saveClassStudyPlan(tx as never, "admin", { academicClassId: "home", semesterId: "s", classIds: ["g", "g"] });
  expect(tx.courseClass.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: ["g"] }, semesterId: "s", educationSystem:"REGULAR", course: { facultyId: "f" } } }));
  expect(tx.classStudyAssignment.deleteMany).toHaveBeenCalledWith({ where: { academicClassId: "home", class: { semesterId: "s" } } });
  expect(tx.classStudyAssignment.createMany).toHaveBeenCalledWith({ data: [{ academicClassId: "home", classId: "g" }] });
});
test("chặn lớp học phần khác khoa/học kỳ và hai nhóm cùng môn trước khi xóa phân công", async () => {
  const tx = database();
  tx.courseClass.findMany.mockResolvedValue([]);
  await expect(saveClassStudyPlan(tx as never, "admin", { academicClassId: "home", semesterId: "s", classIds: ["g"] })).rejects.toThrow("Chỉ chọn");
  tx.courseClass.findMany.mockResolvedValue([studyGroup(),studyGroup("h")]);
  await expect(saveClassStudyPlan(tx as never, "admin", { academicClassId: "home", semesterId: "s", classIds: ["g", "h"] })).rejects.toThrow("Mỗi môn");
  expect(tx.classStudyAssignment.deleteMany).not.toHaveBeenCalled();
});
test("lưu riêng thay danh sách học kỳ, khôi phục mặc định bỏ cờ riêng và đăng ký riêng", async () => {
  const tx = database();
  await saveStudentStudyPlan(tx as never, "admin", { studentId: "sv", semesterId: "s", classIds: ["g"] });
  expect(tx.enrollment.deleteMany).toHaveBeenCalledWith({ where: { studentId: "sv", class: { semesterId: "s" } } });
  expect(tx.studentStudyPlan.create).toHaveBeenCalledWith({ data: { studentId: "sv", semesterId: "s" } });
  tx.studentStudyPlan.create.mockClear();
  await saveStudentStudyPlan(tx as never, "admin", { studentId: "sv", semesterId: "s", classIds: [], reset: true });
  expect(tx.studentStudyPlan.create).not.toHaveBeenCalled();
  expect(tx.studentStudyPlan.deleteMany).toHaveBeenLastCalledWith({ where: { studentId: "sv", semesterId: "s" } });
});

test("chặn nhóm chưa có đúng một giảng viên hoặc giảng viên đã khóa trước khi ghi phân công",async()=>{
 const tx=database();
 for(const teachers of [[],[{lecturer:teacher},{lecturer:teacher}],[{lecturer:{...teacher,user:{...teacher.user,active:false}}}]]){
  tx.courseClass.findMany.mockResolvedValue([{...studyGroup(),teachings:teachers}]);
  await expect(saveClassStudyPlan(tx as never,"admin",{academicClassId:"home",semesterId:"s",classIds:["g"]})).rejects.toThrow("Mỗi lớp học phần");
 }
 expect(tx.classStudyAssignment.deleteMany).not.toHaveBeenCalled();
});
function enrollmentDb() {
  const group = { id: "g", courseId: "A", semesterId: "s", educationSystem: "REGULAR", course: { facultyId: "f" } };
  const student = { academicClass: { facultyId: "f", educationSystem: "REGULAR", studyAssignments: [{ class: group }] }, enrollments: [] as { class: typeof group }[], studyPlans: [] as { semesterId: string }[] };
  const tx = { studentProfile: { findUniqueOrThrow: vi.fn().mockResolvedValue(student) }, courseClass: { findMany: vi.fn().mockResolvedValue([group]) }, enrollment: { createMany: vi.fn() } };
  return { group, student, tx };
}
test("ghi danh bổ sung kiểm tra khoa hệ học học kỳ, vẫn cho phép phân công giảng viên sau", async () => {
  const { tx } = enrollmentDb();
  await addStudentEnrollments(tx as never, "sv", ["g", "g"], "s");
  expect(tx.courseClass.findMany.mock.calls[0][0].where).toEqual({ id: { in: ["g"] }, semesterId: "s", educationSystem: "REGULAR", course: { facultyId: "f" } });
  expect(tx.enrollment.createMany).toHaveBeenCalledWith({ data: [{ classId: "g", studentId: "sv" }], skipDuplicates: true });
  tx.courseClass.findMany.mockResolvedValue([]); tx.enrollment.createMany.mockClear();
  await expect(addStudentEnrollments(tx as never, "sv", ["foreign"], "s")).rejects.toThrow("đúng khoa");
  expect(tx.enrollment.createMany).not.toHaveBeenCalled();
});
test("không ghi danh hai nhóm cùng môn kể cả khi xung đột với phân công chung", async () => {
  const { group, student, tx } = enrollmentDb();
  tx.courseClass.findMany.mockResolvedValue([{ ...group, id: "other" }]);
  await expect(addStudentEnrollments(tx as never, "sv", ["other"])).rejects.toThrow("Mỗi môn");
  expect(tx.enrollment.createMany).not.toHaveBeenCalled();
  student.studyPlans = [{ semesterId: "s" }];
  await addStudentEnrollments(tx as never, "sv", ["other"]);
  expect(tx.enrollment.createMany).toHaveBeenCalledOnce();
});
test("cùng môn ở hai học kỳ khác nhau vẫn đăng ký được", async () => {
  const { group, tx } = enrollmentDb();
  tx.courseClass.findMany.mockResolvedValue([{ ...group, id: "next", semesterId: "next-term" }]);
  await addStudentEnrollments(tx as never, "sv", ["next"]);
  expect(tx.enrollment.createMany).toHaveBeenCalledOnce();
});
test("chuyển lớp kiểm tra môn riêng với khoa hệ mới và phân công chung", async () => {
  const { group, tx } = enrollmentDb();
  const target = { facultyId: "f", educationSystem: "REGULAR", studyAssignments: [{ class: group }] };
  const database = { ...tx, academicClass: { findUniqueOrThrow: vi.fn().mockResolvedValue(target) } };
  const student = { enrollments: [{ class: { ...group, id: "own" } }], studyPlans: [] as { semesterId: string }[] };
  tx.studentProfile.findUniqueOrThrow.mockResolvedValue(student);
  await expect(checkStudentPlacement(database as never, "sv", "target")).rejects.toThrow("Không thể chuyển lớp");
  student.studyPlans = [{ semesterId: "s" }];
  await expect(checkStudentPlacement(database as never, "sv", "target")).resolves.toBeUndefined();
  target.educationSystem = "DISTANCE";
  await expect(checkStudentPlacement(database as never, "sv", "target")).rejects.toThrow("Không thể chuyển lớp");
});

test("đổi phân công chung kiểm tra ghi danh bổ sung trước khi thay lịch lớp", async () => {
  const tx = database();
  tx.enrollment.findFirst.mockResolvedValue({ student: { studentCode: "SV01" }, class: { code: "A02" } });
  await expect(saveClassStudyPlan(tx as never, "admin", { academicClassId: "home", semesterId: "s", classIds: ["g"] })).rejects.toThrow("SV01 đã ghi danh lớp A02");
  expect(tx.enrollment.findFirst.mock.calls[0][0].where).toEqual({
    student: { academicClassId: "home", studyPlans: { none: { semesterId: "s" } } },
    class: { semesterId: "s", courseId: { in: ["A"] }, id: { notIn: ["g"] } },
  });
  expect(tx.classStudyAssignment.deleteMany).not.toHaveBeenCalled();
});
