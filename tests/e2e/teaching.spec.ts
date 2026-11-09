import {expect,test,type Page} from "@playwright/test";
import {PrismaClient} from "@prisma/client";
import {hash} from "argon2";
import {randomUUID} from "node:crypto";

test.describe("đánh giá giảng viên thực dạy",()=>{
  test.skip(!process.env.ISOLATED_FEATURE_DB,"Chỉ chạy trên database nghiệm thu riêng.");
  test.setTimeout(120000);
  test.use({actionTimeout:15000});
  const db=new PrismaClient(),tag=`TEACH-${randomUUID().slice(0,6)}`,password=randomUUID();
  let homeId:string,facultyId:string,semesterId:string,courseId:string,commonId:string,subjectId:string,campaignId:string;
  const teachers:{id:string;email:string;name:string}[]=[],students:{id:string;email:string}[]=[],classes:string[]=[];
  test.beforeAll(async()=>{
    expect(new URL(process.env.DATABASE_URL!).pathname).toBe(`/${process.env.ISOLATED_FEATURE_DB}`);
    const passwordHash=await hash(password);
    await db.user.create({data:{name:tag,email:`${tag}-admin@example.invalid`,passwordHash,roles:{create:{role:"ADMIN"}}}});
    facultyId=(await db.faculty.create({data:{code:tag,name:tag}})).id;
    const home=await db.academicClass.create({data:{code:tag,name:tag,facultyId}});
    homeId=home.id;
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
  test("mỗi lớp một giảng viên, chốt người dạy và giữ phiếu khi đổi phân công",async({page})=>{
    await login(page,`${tag}-admin@example.invalid`);await page.goto("/admin/campaigns/new");
    await page.getByLabel("Tên đợt khảo sát").fill(`${tag} khảo sát`);await page.getByRole("combobox",{name:"Học kỳ khảo sát",exact:true}).selectOption(semesterId);await page.getByRole("combobox",{name:"Khoa tổ chức",exact:true}).selectOption(facultyId);await page.locator(`input[name="academicClassIds"][value="${homeId}"]`).check();await page.getByRole("combobox",{name:"Mẫu câu hỏi chung",exact:true}).selectOption(commonId);await page.getByRole("combobox",{name:"Mẫu đánh giá môn học",exact:true}).selectOption(subjectId);await page.getByRole("combobox",{name:"Đối tượng đánh giá",exact:true}).selectOption("LECTURER");await page.locator(`input[name="courseIds"][value="${courseId}"]`).check();await page.getByLabel("Bắt đầu",{exact:true}).fill("2026-01-01");await page.getByLabel("Kết thúc",{exact:true}).fill("2027-12-31");await page.getByRole("button",{name:"Tạo đợt khảo sát",exact:true}).click();await expect(page).toHaveURL(/created=1/);
    campaignId=(await db.surveyCampaign.findFirstOrThrow({where:{title:`${tag} khảo sát`}})).id;
    await page.goto(`/admin/campaigns/${campaignId}/review`);await page.getByRole("button",{name:"Công bố",exact:true}).click();await expect(page.locator("main").getByRole("alert")).toContainText("Chưa phân công");expect(await db.surveyParticipation.count({where:{campaignId}})).toBe(0);
    await page.goto("/admin/classes/new");const row=page.locator("main tbody tr").filter({has:page.getByText(`${tag}.0`,{exact:true})});await row.getByText("Phân công / Cập nhật",{exact:true}).click();
    await row.getByRole("combobox",{name:"Giảng viên thực dạy",exact:true}).selectOption(teachers[0].id);
    await row.getByRole("button",{name:"Lưu phân công",exact:true}).click();await expect(row.getByRole("status")).toContainText("Đã cập nhật");
    await page.goto(`/admin/campaigns/${campaignId}/review`);await page.getByRole("button",{name:"Công bố",exact:true}).click();await expect(page).toHaveURL(/published=1/);
    expect(await db.participationTeaching.count({where:{participation:{campaignId}}})).toBe(4);
    await page.goto("/admin/classes/new");const historical=page.locator("main tbody tr").filter({has:page.getByText(`${tag}.2`,{exact:true})});await historical.getByText("Phân công / Cập nhật",{exact:true}).click();await historical.getByRole("combobox",{name:"Giảng viên thực dạy",exact:true}).selectOption(teachers[2].id);await historical.getByRole("button",{name:"Lưu phân công",exact:true}).click();await expect(historical.getByRole("status")).toContainText("Đã cập nhật");expect((await db.courseClass.findUniqueOrThrow({where:{id:classes[2]}})).lecturerId).toBe(teachers[0].id);
    await db.courseTeaching.deleteMany({where:{classId:classes[0]}});await db.courseTeaching.create({data:{classId:classes[0],lecturerId:teachers[2].id}});
    for(let i=0;i<4;i++){
      await login(page,students[i].email);const response=await page.request.get(`/api/surveys/${campaignId}`);expect(response.status()).toBe(200);const body=await response.json();
      const ids=[...new Set(body.questions.map((q:{lecturerId:string|null})=>q.lecturerId).filter(Boolean))];expect(ids).toEqual([teachers[i<2?0:1].id]);
      const answers=Object.fromEntries(body.questions.map((q:{id:string;lecturerId:string|null})=>[q.id,q.lecturerId===teachers[0].id?"40":q.lecturerId?"80":"5"]));
      if(i===0){
        const subjectQuestion=body.questions.find((q:{lecturerId:string|null})=>q.lecturerId).questionId;
        expect((await page.request.post(`/api/surveys/${campaignId}/submit`,{data:{...answers,[`${courseId}:${teachers[2].id}:${subjectQuestion}`]:"100"}})).status()).toBe(400);
        await page.goto(`/student/surveys/${campaignId}`);
        await expect(page.getByRole("navigation",{name:"Các phần khảo sát"}).getByRole("button")).toHaveCount(2);
        await page.getByRole("radio",{name:"5",exact:true}).check();
        await page.getByRole("button",{name:"Gửi phản hồi",exact:true}).click();await expect(page.locator(".student-survey").getByRole("alert")).toContainText("Còn câu trả lời thiếu");await expect(page.locator(".survey-section-panel:visible")).toContainText(teachers[0].name);
        expect(await db.submission.count({where:{campaignId}})).toBe(0);
        await page.getByRole("button",{name:"Lưu bản nháp",exact:true}).click();await expect(page.getByRole("status")).toContainText("Đã lưu bản nháp");await page.reload();
        await expect(page.getByText("Đã điền 1/2 câu",{exact:true})).toBeVisible();await page.getByRole("radio",{name:"40",exact:true}).check();
        await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
        await page.getByRole("combobox",{name:"Chuyển phần khảo sát",exact:true}).selectOption("0");await expect(page.getByRole("radio",{name:"5",exact:true})).toBeChecked();
        await page.getByRole("button",{name:"Gửi phản hồi",exact:true}).click();await expect(page).toHaveURL(/submitted=1/);continue;
      }
      expect((await page.request.post(`/api/surveys/${campaignId}/submit`,{data:answers})).status()).toBe(201);
    }
    await login(page,`${tag}-admin@example.invalid`);await page.goto("/admin");const campaignRow=page.locator("section.question").filter({has:page.getByRole("heading",{name:`${tag} khảo sát`,exact:true})});await campaignRow.getByText("Thao tác khác",{exact:true}).click();await campaignRow.getByRole("button",{name:"Đóng khảo sát",exact:true}).click();await expect(campaignRow.getByText("Đã đóng",{exact:true})).toBeVisible();
    const adminReport=await (await page.request.get(`/api/reports/campaigns/${campaignId}`)).json();expect(adminReport.questions.filter((q:{lecturerId:string|null})=>q.lecturerId).map((q:{average:number})=>q.average).sort()).toEqual([40,80]);
    for(let i=0;i<3;i++){
      await login(page,teachers[i].email);const response=await page.request.get(`/api/reports/campaigns/${campaignId}`);
      if(i===2){expect(response.status()).toBe(400);continue;}
      expect(response.status()).toBe(200);const report=await response.json();expect(report.questions).toHaveLength(1);expect(report.questions[0]).toMatchObject({lecturerId:teachers[i].id,average:i?80:40,invited:2});
      await page.goto(`/lecturer?campaign=${campaignId}`);await expect(page.locator("#ket-qua")).toContainText(teachers[i].name);await expect(page.locator("#ket-qua")).not.toContainText(teachers[i?0:1].name);
    }
  });
  test("đồng giảng được xem kết quả chung của môn, người dạy cũ không còn phân công không được xem",async({page})=>{
    const course=await db.course.create({data:{code:`${tag}-SHARED`,name:`${tag} Môn chung`,facultyId}});
    await db.courseClass.create({data:{code:`${tag}-SHARED.1`,courseId:course.id,semesterId,lecturerId:teachers[0].id,teachingConfigured:true,teachings:{create:{lecturerId:teachers[1].id}}}});
    const common=await db.surveyTemplate.findUniqueOrThrow({where:{id:commonId},include:{questions:true}}),specific=await db.surveyTemplate.findUniqueOrThrow({where:{id:subjectId},include:{questions:true}});
    const campaign=await db.surveyCampaign.create({data:{title:`${tag} Kết quả môn chung`,scope:"FACULTY",facultyId,semesterId,templateId:commonId,courseTemplateId:subjectId,evaluationMode:"COURSE",status:"CLOSED",startsAt:new Date("2026-01-01"),endsAt:new Date("2026-01-02"),courseTargets:{create:{courseId:course.id}}}});
    for(const student of students.slice(0,2)){
      await db.surveyParticipation.create({data:{campaignId:campaign.id,studentId:student.id,status:"COMPLETED",completedAt:new Date(),courses:{create:{courseId:course.id}}}});
      await db.submission.create({data:{campaignId:campaign.id,answers:{create:[{questionId:common.questions[0].id,value:"5"},{questionId:specific.questions[0].id,courseId:course.id,value:"90"}]}}});
    }
    await login(page,teachers[1].email);await page.goto(`/lecturer?campaign=${campaign.id}`);await expect(page.locator("#ket-qua")).toContainText("không phải điểm đánh giá cá nhân giảng viên");await expect(page.locator("#ket-qua .report-score")).toContainText("90");
    expect((await page.request.get(`/api/reports/campaigns/${campaign.id}`)).status()).toBe(200);
    await login(page,teachers[0].email);await page.goto(`/lecturer?campaign=${campaign.id}`);await expect(page.locator("#ket-qua")).toContainText("Không tìm thấy báo cáo trong phạm vi");expect((await page.request.get(`/api/reports/campaigns/${campaign.id}`)).status()).toBe(400);
  });
});
