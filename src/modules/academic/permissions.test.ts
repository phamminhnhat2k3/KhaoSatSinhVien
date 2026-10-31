import {expect,test} from "vitest";
import {canManageFaculty} from "./permissions";
test("chỉ admin được thay đổi dữ liệu nghiệp vụ khoa",()=>{
 expect(canManageFaculty(["ADMIN"])).toBe(true);
 expect(canManageFaculty(["DEAN","LECTURER"])).toBe(false);
 expect(canManageFaculty(["LECTURER"])).toBe(false);
 expect(canManageFaculty(["STUDENT"])).toBe(false);
});
