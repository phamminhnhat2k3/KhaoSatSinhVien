import {expect,test} from "vitest";
import {canViewCourseResult} from "./teaching-scope";
test("giảng viên đồng giảng xem kết quả chung của môn đúng học kỳ, không dùng người dạy cũ sau khi đã chốt phân công mới",()=>{
 const course={classes:[{lecturerId:"old",semesterId:"s",teachingConfigured:true,teachings:[{lecturerId:"actual"}]}]};
 expect(canViewCourseResult(course,"actual","s")).toBe(true);
 expect(canViewCourseResult(course,"actual","other")).toBe(false);
 expect(canViewCourseResult(course,"old","s")).toBe(false);
 expect(canViewCourseResult({classes:[{lecturerId:"old",semesterId:"s"}]},"old","s")).toBe(true);
 expect(canViewCourseResult({...course,lecturers:[{id:"former"}]},"former","s")).toBe(false);
});
