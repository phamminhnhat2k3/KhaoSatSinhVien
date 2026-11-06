import {expect,test,vi} from "vitest";
import {assignClassTeachers} from "./teaching";
test("phân công chỉ nhận giảng viên hoạt động đúng khoa và mỗi lớp chỉ một người",async()=>{
  const tx={courseClass:{update:vi.fn().mockResolvedValue({courseId:"A",course:{facultyId:"f"}})},lecturerProfile:{count:vi.fn().mockResolvedValue(1)},courseTeaching:{deleteMany:vi.fn(),createMany:vi.fn()},course:{update:vi.fn()},auditLog:{create:vi.fn()}};
  await assignClassTeachers(tx as never,"admin","class",["t1","t1"]);
  expect(tx.courseClass.update).toHaveBeenCalledWith({where:{id:"class"},data:{teachingConfigured:true},include:{course:true}});
  expect(tx.courseTeaching.createMany).toHaveBeenCalledWith({data:[{classId:"class",lecturerId:"t1"}]});
  expect(tx.lecturerProfile.count).toHaveBeenCalledWith({where:{id:{in:["t1"]},facultyId:"f",user:{active:true,roles:{some:{role:"LECTURER"}}}}});
  tx.courseTeaching.deleteMany.mockClear();tx.lecturerProfile.count.mockResolvedValue(0);
  await expect(assignClassTeachers(tx as never,"admin","class",["foreign"])).rejects.toThrow("Chỉ chọn giảng viên");
  expect(tx.courseTeaching.deleteMany).not.toHaveBeenCalled();
});

test("không cho phân công hai giảng viên ngay cả khi gửi trực tiếp lên máy chủ",async()=>{
 const tx={courseClass:{update:vi.fn()}};
 await expect(assignClassTeachers(tx as never,"admin","class",["t1","t2"])).rejects.toThrow("chỉ được phân công một");
 expect(tx.courseClass.update).not.toHaveBeenCalled();
});
