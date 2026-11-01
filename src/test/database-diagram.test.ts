import {readFileSync} from "node:fs";
import {Prisma} from "@prisma/client";
import {chromium} from "@playwright/test";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {expect,test} from "vitest";
const dbml=readFileSync("docs/database/database.dbml","utf8");
test("sơ đồ đơn giản vẫn chọn được bảng và phóng to mà không mất quan hệ",async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();await page.goto(pathToFileURL(resolve("docs/database/database-diagram.html")).href);
  expect(await page.locator(".table").count()).toBe(25);
  expect(await page.locator("path[data-from]").count()).toBe(40);
  expect(await page.locator("#User").evaluate(el=>getComputedStyle(el).boxShadow)).toBe("none");
  await page.locator("#Submission").focus();await page.keyboard.press("Enter");
  expect(await page.locator(".selected").getAttribute("id")).toBe("Submission");
  expect(await page.locator("path.active").count()).toBe(2);
  await page.getByRole("button",{name:"Bỏ chọn",exact:true}).click();expect(await page.locator(".faded").count()).toBe(0);
  await page.getByRole("button",{name:"+",exact:true}).click();expect(await page.locator("#zoom").textContent()).toBe("110%");
 }finally{await browser.close();}
});
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
test("bản tinh gọn chỉ vẽ quan hệ có thật và chia thành bốn nhóm dễ đọc",()=>{
 const compact=readFileSync("docs/database/database-simple.mmd","utf8");
 expect(compact.match(/subgraph /g)).toHaveLength(4);
 const nodes=new Map([...compact.matchAll(/(P\d+N\d+)\["[^\n]*<br\/>(\w+)"\]/g)].map(m=>[m[1],m[2]]));
 const edges=[...compact.matchAll(/(P\d+N\d+) -->\|"1 : N"\| (P\d+N\d+)/g)];
 expect(edges.length).toBeGreaterThan(10);
 for(const edge of edges){const parent=nodes.get(edge[1]),child=nodes.get(edge[2]);expect(Prisma.dmmf.datamodel.models.find(m=>m.name===child)?.fields.some(f=>f.kind==="object"&&f.type===parent&&f.relationFromFields?.length)).toBe(true);}
});
