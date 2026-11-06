import { expect, test, vi } from "vitest";
import { effectiveEnrollments, saveClassStudyPlan, saveStudentStudyPlan } from "./study-plan";

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
    enrollment: { deleteMany: vi.fn(), createMany: vi.fn() },
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
