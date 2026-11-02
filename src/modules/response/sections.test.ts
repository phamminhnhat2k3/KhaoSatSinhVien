import {expect,test} from "vitest";
import {surveySections} from "./sections";
test("gom đúng cặp môn–giảng viên, không gộp hai người dạy cùng môn hoặc cùng người dạy hai môn",()=>{
 const q=(id:string,courseId:string|null=null,lecturerId:string|null=null)=>({id,courseId,lecturerId,required:true,sectionTitle:"Tên trùng"});
 const sections=surveySections([q("common"),q("a1","A","t1"),q("a2","A","t1"),q("b","A","t2"),q("c","B","t1"),q("d","C")]);
 expect(sections.map(s=>[s.id,s.questions.map(q=>q.id)])).toEqual([["common",["common"]],["A:t1",["a1","a2"]],["A:t2",["b"]],["B:t1",["c"]],["C:course",["d"]]]);
 expect(sections.map(s=>s.kind)).toEqual(["Nội dung chung","Đánh giá giảng viên","Đánh giá giảng viên","Đánh giá giảng viên","Đánh giá môn học"]);
 expect(surveySections([])).toEqual([]);
});
