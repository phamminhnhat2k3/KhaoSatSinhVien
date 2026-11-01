import {expect,test} from "vitest";
import {answerProgress} from "./progress";
test("đếm câu đã điền, phân biệt câu bắt buộc và giá trị trống",()=>{
 const questions=[{id:"scale",required:true},{id:"choice",required:true},{id:"text",required:false}];
 expect(answerProgress(questions,{scale:"0",choice:[],text:"  "})).toEqual({answered:1,remainingRequired:1});
 expect(answerProgress(questions,{scale:"5",choice:["1","2"],text:"Góp ý"})).toEqual({answered:3,remainingRequired:0});
 expect(answerProgress(questions,{})).toEqual({answered:0,remainingRequired:2});
});
