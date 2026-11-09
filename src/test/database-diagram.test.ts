import {readFileSync} from "node:fs";
import {Prisma} from "@prisma/client";
import {chromium} from "@playwright/test";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {expect,test} from "vitest";
const dbml=readFileSync("docs/database/database.dbml","utf8");
test("draw.io có đủ bảng, cột và đầu nối chỉnh sửa được, không nhúng ảnh",()=>{
 const xml=readFileSync("docs/database/database-web.drawio","utf8");
 expect(xml.match(/<mxCell id="\w+\.\w+"/g)).toHaveLength(137);
 expect(xml.match(/edge="1"/g)).toHaveLength(48);
 expect(xml).not.toMatch(/image=|data:image|approvedAt|approvedBy|reviewNote/);
 for(const m of Prisma.dmmf.datamodel.models)expect(xml).toContain(`<mxCell id="${m.name}"`);
 const refs=readFileSync("docs/database/database-web.dbml","utf8");
 for(const r of refs.matchAll(/^Ref: (\w+)\.(\w+) > (\w+)\.(\w+)/gm))expect(xml).toContain(`source="${r[1]}.${r[2]}" target="${r[3]}.${r[4]}"`);
});
test("ảnh SVG của web là vector, giữ các bảng và quan hệ đang dùng",()=>{
 const svg=readFileSync("docs/database/database-diagram.svg","utf8");
 expect(svg).toContain('viewBox="0 0 2200 2690"');
 expect(svg).not.toMatch(/<image\b|data:image/);
 expect(svg.match(/<g id=/g)).toHaveLength(29);
 expect(svg.match(/class="relation"/g)).toHaveLength(48);
 expect(svg.match(/class="field"/g)).toHaveLength(137);
 expect(svg).not.toMatch(/approvedAt|approvedBy|reviewNote/);
 for(const model of Prisma.dmmf.datamodel.models)expect(svg).toContain(`<g id="${model.name}">`);
});
test("sơ đồ đơn giản vẫn chọn được bảng và phóng to mà không mất quan hệ",async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();await page.goto(pathToFileURL(resolve("docs/database/database-diagram.html")).href);
  expect(await page.locator(".table").count()).toBe(29);
  expect(await page.locator("path[data-from]").count()).toBe(48);
  expect(await page.locator("#User").evaluate(el=>getComputedStyle(el).boxShadow)).toBe("none");
  await page.locator("#Submission").focus();await page.keyboard.press("Enter");
  expect(await page.locator(".selected").getAttribute("id")).toBe("Submission");
  expect(await page.locator("path.active").count()).toBe(2);
  await page.getByRole("button",{name:"Bỏ chọn",exact:true}).click();expect(await page.locator(".faded").count()).toBe(0);
  await page.getByRole("button",{name:"+",exact:true}).click();expect(await page.locator("#zoom").textContent()).toBe("110%");
 }finally{await browser.close();}
});
function table(name:string,source=dbml){const body=source.replaceAll("\r\n","\n").split(`Table ${name} {\n`)[1]?.split("\n}\n")[0];expect(body,`Thiếu bảng ${name}`).toBeTruthy();return body!;}

test("bản web chỉ lược xét duyệt đã bỏ, không bỏ bảng liên kết vẫn hoạt động",()=>{
 const web=readFileSync("docs/database/database-web.dbml","utf8");
 const omitted=["approvedAt","approvedBy","reviewNote"];
 expect(web.match(/^Table /gm)).toHaveLength(29);expect(web.match(/^Ref:/gm)).toHaveLength(48);
 for(const model of Prisma.dmmf.datamodel.models)for(const f of model.fields.filter(f=>f.kind!=="object")){
  const body=table(model.name,web);if(model.name==="SurveyCampaign"&&omitted.includes(f.name))expect(body).not.toContain(`  ${f.name} `);else expect(body).toContain(`  ${f.name} `);
 }
 for(const name of ["CourseTeaching","ParticipationTeaching","ParticipationCourse","CampaignCourse","Notification","AuditLog","SurveyTarget"])expect(web).toContain(`Table ${name} {`);
});
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
