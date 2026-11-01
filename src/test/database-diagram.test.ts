import {readFileSync} from "node:fs";
import {Prisma} from "@prisma/client";
import {expect,test} from "vitest";
const dbml=readFileSync("docs/database/database.dbml","utf8");
function table(name:string){const body=dbml.split(`Table ${name} {\n`)[1]?.split("\n}\n")[0];expect(body,`Thiếu bảng ${name}`).toBeTruthy();return body!;}
test("sơ đồ đủ bảng và mọi cột của schema hiện tại",()=>{
 expect(dbml.match(/^Table /gm)).toHaveLength(Prisma.dmmf.datamodel.models.length+1);
 for(const model of Prisma.dmmf.datamodel.models){const body=table(model.name);for(const f of model.fields.filter(f=>f.kind!=="object"))expect(body).toContain(`  ${f.name} `);}
 expect(table("_CourseToLecturerProfile")).toContain("  A ");
});
test("khóa ngoại khớp schema, bao gồm liên kết môn và giảng viên tự động",()=>{
 let relations=2;
 for(const model of Prisma.dmmf.datamodel.models)for(const f of model.fields){for(const [i,from]of(f.relationFromFields??[]).entries()){expect(dbml).toContain(`Ref: ${model.name}.${from} > ${f.type}.${f.relationToFields![i]}`);relations++;}}
 expect(dbml.match(/^Ref:/gm)).toHaveLength(relations);
 expect(dbml).toContain("Ref: _CourseToLecturerProfile.A > Course.id");
 expect(dbml).toContain("Ref: _CourseToLecturerProfile.B > LecturerProfile.id");
});
test("không vẽ liên kết định danh sinh viên vào bài trả lời",()=>{
 expect(table("Submission")).not.toMatch(/studentId|participationId|userId/);
 expect(table("SurveyParticipation")).toContain("studentId");
 expect(dbml).not.toContain("Ref: SurveyCampaign.approvedBy");
});
