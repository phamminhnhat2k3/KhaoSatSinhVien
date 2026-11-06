import {expect,test} from "vitest";
import {teachingPairs} from "./teaching";
const teacher=(id:string)=>({id,facultyId:"f",user:{active:true,roles:[{role:"LECTURER"}]}});
test("chốt đúng người thực dạy, chỉ một người mỗi môn và bỏ lặp các đăng ký cùng người dạy",()=>{
  const group={code:"A1",courseId:"A",lecturer:null,teachings:[{lecturer:teacher("t1")}]};
  expect(teachingPairs([{class:group},{class:{...group,code:"A2",teachings:[{lecturer:teacher("t1")}]}}],"f")).toEqual([{courseId:"A",lecturerId:"t1"}]);
  expect(()=>teachingPairs([{class:{...group,teachings:[{lecturer:teacher("t1")},{lecturer:teacher("t2")}]}}],"f")).toThrow("Mỗi lớp học phần");
  expect(()=>teachingPairs([{class:group},{class:{...group,teachings:[{lecturer:teacher("t2")}]}}],"f")).toThrow("Mỗi môn");
  expect(()=>teachingPairs([{class:{...group,teachings:[]}}],"f")).toThrow("Chưa phân công");
  expect(()=>teachingPairs([{class:group}],"other")).toThrow("không thuộc khoa");
  expect(()=>teachingPairs([{class:{...group,teachings:[{lecturer:{...teacher("t1"),user:{active:false,roles:[{role:"LECTURER"}]}}}]}}],"f")).toThrow("không còn hoạt động");
  expect(teachingPairs([{class:{...group,teachings:[],lecturer:teacher("legacy")}}],"f")).toEqual([{courseId:"A",lecturerId:"legacy"}]);
  expect(()=>teachingPairs([{class:{...group,teachingConfigured:true,teachings:[],lecturer:teacher("legacy")}}],"f")).toThrow("Chưa phân công");
});
