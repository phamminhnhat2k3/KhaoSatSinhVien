import {expect,test} from "vitest";
import {lecturerWhere} from "./lecturers";
test("lọc trưởng khoa riêng, giảng viên thường không bao gồm trưởng khoa",()=>{
 expect(lecturerWhere({role:"DEAN"}).user).toEqual({AND:[expect.anything(),{roles:{some:{role:"DEAN"}}}]});
 expect(lecturerWhere({role:"LECTURER"}).user).toEqual({AND:[expect.anything(),{roles:{some:{role:"LECTURER"},none:{role:"DEAN"}}}]});
});
test("kết hợp khoa, trạng thái và tìm tên email mã nghiệp vụ",()=>{
 const where=lecturerWhere({facultyId:"f",active:"false",q:" GV01 "});
 expect(where.facultyId).toBe("f");
 expect(where.user).toEqual({AND:[{AND:[{OR:expect.arrayContaining([{name:{contains:"GV01"}},{email:{contains:"GV01"}},{lecturer:{lecturerCode:{contains:"GV01"}}}])},{active:false}]}]});
});
