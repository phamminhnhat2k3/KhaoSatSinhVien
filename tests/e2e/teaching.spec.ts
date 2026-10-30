import {expect,test,type Page} from "@playwright/test";
import {PrismaClient} from "@prisma/client";
import {hash} from "argon2";
import {randomUUID} from "node:crypto";

test.describe("đánh giá giảng viên thực dạy",()=>{
  test.skip(!process.env.ISOLATED_FEATURE_DB,"Chỉ chạy trên database nghiệm thu riêng.");
  test.setTimeout(120000);
  test.use({actionTimeout:15000});
  const db=new PrismaClient(),tag=`TEACH-${randomUUID().slice(0,6)}`,password=randomUUID();
  let facultyId:string,semesterId:string,courseId:string,commonId:string,subjectId:string,campaignId:string;
  const teachers:{id:string;email:string;name:string}[]=[],students:{id:string;email:string}[]=[],classes:string[]=[];
  test.beforeAll(async()=>{
    expect(new URL(process.env.DATABASE_URL!).pathname).toBe(`/${process.env.ISOLATED_FEATURE_DB}`);
    const passwordHash=await hash(password);
    await db.user.create({data:{name:tag,email:`${tag}-admin@example.invalid`,passwordHash,roles:{create:{role:"ADMIN"}}}});
    facultyId=(await db.faculty.create({data:{code:tag,name:tag}})).id;
    const home=await db.academicClass.create({data:{code:tag,name:tag,facultyId}});
    semesterId=(await db.semester.create({data:{name:tag,startsAt:new Date("2026-01-01"),endsAt:new Date("2027-12-31")}})).id;
    for(let i=0;i<3;i++){
      const user=await db.user.create({data:{name:`${tag} GV${i}`,email:`${tag}-gv${i}@example.invalid`,passwordHash,roles:{create:{role:"LECTURER"}},lecturer:{create:{lecturerCode:`${tag}-GV${i}`,facultyId}}},include:{lecturer:true}});
      teachers.push({id:user.lecturer!.id,email:user.email,name:user.name});
    }
    courseId=(await db.course.create({data:{code:tag,name:tag,facultyId,lecturers:{connect:teachers.map(t=>({id:t.id}))}}})).id;
    for(let i=0;i<3;i++)classes.push((await db.courseClass.create({data:{code:`${tag}.${i}`,courseId,semesterId,...(i===2?{lecturerId:teachers[0].id}:{}),...(i?{teachings:{create:{lecturerId:teachers[i===1?1:0].id}}}:{})}})).id);
    for(let i=0;i<4;i++){
      const user=await db.user.create({data:{name:`${tag} SV${i}`,email:`${tag}-sv${i}@example.invalid`,passwordHash,roles:{create:{role:"STUDENT"}},student:{create:{studentCode:`${tag}-SV${i}`,academicClassId:home.id}}},include:{student:true}});
      students.push({id:user.student!.id,email:user.email});
      await db.enrollment.create({data:{studentId:user.student!.id,classId:classes[i<2?0:1]}});
    }
    await db.enrollment.create({data:{studentId:students[0].id,classId:classes[2]}});
    commonId=(await db.surveyTemplate.create({data:{title:`${tag} chung`,questions:{create:{content:"Đánh giá chung",position:1,type:"SCALE"}}}})).id;
    subjectId=(await db.surveyTemplate.create({data:{title:`${tag} giảng viên`,questions:{create:{content:"Chất lượng giảng dạy",position:1,type:"SCALE",scaleMin:0,scaleMax:100,scaleStep:10}}}})).id;
  });
  test.afterAll(async()=>{await db.user.updateMany({where:{name:{startsWith:tag}},data:{active:false}});await db.$disconnect();});
  async function login(page:Page,email:string){
    await page.context().clearCookies();await page.goto("/login");await page.getByLabel("Email",{exact:true}).fill(email);await page.getByLabel("Mật khẩu",{exact:true}).fill(password);await page.getByRole("button",{name:"Đăng nhập",exact:true}).click();await expect(page).not.toHaveURL(/\/login$/);
  }
  test("phân công đồng giảng, chốt người dạy, trả lời đúng người và báo cáo tách riêng",async({page})=>{
    await login(page,`${tag}-admin@example.invalid`);await page.goto("/admin/campaigns/new");
    await page.getByLabel("Tên đợt khảo sát").fill(`${tag} khảo sát`);await page.getByRole("combobox",{name:"Khoa tổ chức",exact:true}).selectOption(facultyId);await page.getByRole("combobox",{name:"Học kỳ khảo sát",exact:true}).selectOption(semesterId);await page.getByRole("combobox",{name:"Mẫu câu hỏi chung",exact:true}).selectOption(commonId);await page.getByRole("combobox",{name:"Mẫu đánh giá môn học",exact:true}).selectOption(subjectId);await page.getByRole("combobox",{name:"Đối tượng đánh giá",exact:true}).selectOption("LECTURER");await page.locator(`input[name="courseIds"][value="${courseId}"]`).check();await page.getByLabel("Bắt đầu",{exact:true}).fill("2026-01-01");await page.getByLabel("Kết thúc",{exact:true}).fill("2027-12-31");await page.getByRole("button",{name:"Tạo đợt khảo sát",exact:true}).click();await expect(page).toHaveURL(/created=1/);
    campaignId=(await db.surveyCampaign.findFirstOrThrow({where:{title:`${tag} khảo sát`}})).id;
    await page.goto(`/admin/campaigns/${campaignId}/review`);await page.getByRole("button",{name:"Công bố",exact:true}).click();await expect(page.locator("main").getByRole("alert")).toContainText("Chưa phân công");expect(await db.surveyParticipation.count({where:{campaignId}})).toBe(0);
    await page.goto("/admin/classes/new");const row=page.locator("main tbody tr").filter({has:page.getByText(`${tag}.0`,{exact:true})});await row.getByText("Phân công / Cập nhật",{exact:true}).click();for(const t of teachers.slice(0,2))await row.getByRole("checkbox",{name:t.name,exact:true}).check();await row.getByRole("button",{name:"Lưu phân công",exact:true}).click();await expect(row.getByRole("status")).toContainText("Đã cập nhật");
    await page.goto(`/admin/campaigns/${campaignId}/review`);await page.getByRole("button",{name:"Công bố",exact:true}).click();await expect(page).toHaveURL(/published=1/);
    expect(await db.participationTeaching.count({where:{participation:{campaignId}}})).toBe(6);
    await page.goto("/admin/classes/new");const historical=page.locator("main tbody tr").filter({has:page.getByText(`${tag}.2`,{exact:true})});await historical.getByText("Phân công / Cập nhật",{exact:true}).click();await historical.getByRole("checkbox",{name:teachers[0].name,exact:true}).uncheck();await historical.getByRole("checkbox",{name:teachers[2].name,exact:true}).check();await historical.getByRole("button",{name:"Lưu phân công",exact:true}).click();await expect(historical.getByRole("status")).toContainText("Đã cập nhật");expect((await db.courseClass.findUniqueOrThrow({where:{id:classes[2]}})).lecturerId).toBe(teachers[0].id);
    await db.courseTeaching.deleteMany({where:{classId:classes[0]}});await db.courseTeaching.create({data:{classId:classes[0],lecturerId:teachers[2].id}});
    for(let i=0;i<4;i++){
      await login(page,students[i].email);const response=await page.request.get(`/api/surveys/${campaignId}`);expect(response.status()).toBe(200);const body=await response.json();
      const ids=[...new Set(body.questions.map((q:{lecturerId:string|null})=>q.lecturerId).filter(Boolean))].sort();expect(ids).toEqual((i<2?[teachers[0].id,teachers[1].id]:[teachers[1].id]).sort());
      const answers=Object.fromEntries(body.questions.map((q:{id:string;lecturerId:string|null})=>[q.id,q.lecturerId===teachers[0].id?"40":q.lecturerId?"80":"5"]));
      if(i===0){const subjectQuestion=body.questions.find((q:{lecturerId:string|null})=>q.lecturerId).questionId;expect((await page.request.post(`/api/surveys/${campaignId}/submit`,{data:{...answers,[`${courseId}:${teachers[2].id}:${subjectQuestion}`]:"100"}})).status()).toBe(400);expect((await page.request.put(`/api/surveys/${campaignId}/draft`,{data:answers})).status()).toBe(200);}
      expect((await page.request.post(`/api/surveys/${campaignId}/submit`,{data:answers})).status()).toBe(201);
    }
    await login(page,`${tag}-admin@example.invalid`);await page.goto("/admin");const campaignRow=page.locator("section.question").filter({has:page.getByRole("heading",{name:`${tag} khảo sát`,exact:true})});await campaignRow.getByRole("button",{name:"Đóng khảo sát",exact:true}).click();await expect(campaignRow.getByText("Đã đóng",{exact:true})).toBeVisible();
    const adminReport=await (await page.request.get(`/api/reports/campaigns/${campaignId}`)).json();expect(adminReport.questions.filter((q:{lecturerId:string|null})=>q.lecturerId).map((q:{average:number})=>q.average).sort()).toEqual([40,80]);
    await page.goto(`/admin/campaigns/${campaignId}/report`);await expect(page.getByRole("heading",{name:"Kết quả tổng hợp",exact:true})).toBeVisible();await page.screenshot({path:".playwright-cli/lecturer-evaluation-report.png",fullPage:true});
    for(let i=0;i<3;i++){
      await login(page,teachers[i].email);const response=await page.request.get(`/api/reports/campaigns/${campaignId}`);
      if(i===2){expect(response.status()).toBe(400);continue;}
      expect(response.status()).toBe(200);const report=await response.json();expect(report.questions).toHaveLength(1);expect(report.questions[0]).toMatchObject({lecturerId:teachers[i].id,average:i?80:40,invited:i?4:2});
    }
  });
});
