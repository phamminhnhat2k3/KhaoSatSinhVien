import {expect,test} from "@playwright/test";
import {PrismaClient} from "@prisma/client";
import {hash} from "argon2";
import {randomUUID} from "node:crypto";

test.describe("chỉnh sửa và xóa thư viện mẫu",()=>{
  test.skip(!process.env.ISOLATED_FEATURE_DB,"Chỉ chạy trên database nghiệm thu riêng.");
  test.setTimeout(90000);test.use({actionTimeout:15000});
  const db=new PrismaClient(),tag=`TPL-${randomUUID().slice(0,6)}`,password=randomUUID();let unusedId:string,usedId:string,campaignId:string,submissionId:string;
  test.beforeAll(async()=>{
    expect(new URL(process.env.DATABASE_URL!).pathname).toBe(`/${process.env.ISOLATED_FEATURE_DB}`);
    await db.user.create({data:{name:tag,email:`${tag}@example.invalid`,passwordHash:await hash(password),roles:{create:{role:"ADMIN"}}}});
    const common=await db.surveyTemplate.create({data:{title:`${tag} chung`,questions:{create:{content:"Câu hỏi chung",type:"SCALE",position:1}}}});
    unusedId=(await db.surveyTemplate.create({data:{title:`${tag} chưa dùng`,questions:{create:{content:"Góp ý ban đầu",type:"TEXT",position:1}}}})).id;
    usedId=(await db.surveyTemplate.create({data:{title:`${tag} phần môn`,questions:{create:{content:"Nội dung phải giữ",type:"SCALE",position:1}}}})).id;
    const faculty=await db.faculty.create({data:{code:tag,name:tag}}),semester=await db.semester.create({data:{name:tag,startsAt:new Date("2026-01-01"),endsAt:new Date("2027-01-01")}});
    const course=await db.course.create({data:{code:tag,name:tag,facultyId:faculty.id}});
    campaignId=(await db.surveyCampaign.create({data:{title:tag,scope:"FACULTY",facultyId:faculty.id,semesterId:semester.id,templateId:common.id,courseTemplateId:usedId,courseTargets:{create:{courseId:course.id}},status:"CLOSED",startsAt:new Date("2026-01-01"),endsAt:new Date("2026-02-01")}})).id;
    const question=await db.question.findFirstOrThrow({where:{templateId:usedId}}),commonQuestion=await db.question.findFirstOrThrow({where:{templateId:common.id}});
    submissionId=(await db.submission.create({data:{campaignId,answers:{create:[{questionId:question.id,courseId:course.id,value:"5"},{questionId:commonQuestion.id,value:"4"}]}}})).id;
  });
  test.afterAll(async()=>{await db.$disconnect();});
  test("sửa chưa dùng, tạo phiên bản cho mẫu phần môn, xóa có xác nhận và chặn xóa mẫu vừa được dùng",async({page})=>{
    await page.goto("/login");await page.getByLabel("Email",{exact:true}).fill(`${tag}@example.invalid`);await page.getByLabel("Mật khẩu",{exact:true}).fill(password);await page.getByRole("button",{name:"Đăng nhập",exact:true}).click();await expect(page).toHaveURL(/\/admin$/);await page.goto("/admin/templates");
    const row=(id:string)=>page.locator(".template-card").filter({has:page.locator(`a[href="/admin/templates/new?edit=${id}"]`)});
    await row(unusedId).getByRole("link",{name:"Chỉnh sửa",exact:true}).click();await expect(page.getByLabel("Tên mẫu khảo sát",{exact:true})).toHaveValue(`${tag} chưa dùng`);
    await page.getByLabel("Tên mẫu khảo sát",{exact:true}).fill(`${tag} đã sửa`);await page.getByRole("textbox",{name:"Nội dung câu 1",exact:true}).fill("Nội dung cập nhật trực tiếp");await page.getByRole("button",{name:"Lưu thay đổi",exact:true}).click();await expect(page).toHaveURL(/updated=1/);
    const changed=await db.surveyTemplate.findUniqueOrThrow({where:{id:unusedId},include:{questions:true}});expect(changed.version).toBe(2);expect(changed.questions[0].content).toBe("Nội dung cập nhật trực tiếp");
    await expect(row(usedId)).toContainText("Được dùng trong 1 đợt");await expect(row(usedId).getByRole("button",{name:`Xóa mẫu ${tag} phần môn`,exact:true})).toBeDisabled();
    await row(usedId).getByRole("link",{name:"Chỉnh sửa",exact:true}).click();await expect(page.locator("main")).toContainText("Lưu sẽ tạo phiên bản mới");await page.getByRole("textbox",{name:"Nội dung câu 1",exact:true}).fill("Nội dung của phiên bản mới");await page.getByRole("button",{name:"Lưu phiên bản mới",exact:true}).click();await expect(page).toHaveURL(/versioned=1/);
    const source=await db.surveyTemplate.findUniqueOrThrow({where:{id:usedId},include:{questions:{include:{answers:true}}}});expect(source.version).toBe(1);expect(source.questions[0].content).toBe("Nội dung phải giữ");expect(source.questions[0].answers[0].value).toBe("5");expect((await db.surveyCampaign.findUniqueOrThrow({where:{id:campaignId}})).courseTemplateId).toBe(usedId);
    const version=await db.surveyTemplate.findFirstOrThrow({where:{title:`${tag} phần môn`,version:2},include:{questions:true}});expect(version.id).not.toBe(usedId);expect(version.questions[0].content).toBe("Nội dung của phiên bản mới");
    await page.goto(`/admin/campaigns/${campaignId}/responses/${submissionId}`);await expect(page.getByRole("heading",{name:/Nội dung phải giữ/})).toBeVisible();await expect(page.getByRole("heading",{name:/Nội dung của phiên bản mới/})).toHaveCount(0);await page.goto("/admin/templates");
    page.once("dialog",dialog=>dialog.dismiss());await row(unusedId).getByRole("button",{name:`Xóa mẫu ${tag} đã sửa`,exact:true}).click();expect(await db.surveyTemplate.count({where:{id:unusedId}})).toBe(1);
    page.once("dialog",dialog=>dialog.accept());await row(unusedId).getByRole("button",{name:`Xóa mẫu ${tag} đã sửa`,exact:true}).click();await expect(page).toHaveURL(/deleted=1/);expect(await db.surveyTemplate.count({where:{id:unusedId}})).toBe(0);expect(await db.question.count({where:{templateId:unusedId}})).toBe(0);
    await page.goto("/admin/templates");await expect(row(version.id).getByRole("button",{name:`Xóa mẫu ${tag} phần môn`,exact:true})).toBeEnabled();
    await db.surveyCampaign.create({data:{title:`${tag} mới tham chiếu`,templateId:version.id,startsAt:new Date("2026-01-01"),endsAt:new Date("2027-01-01")}});
    page.once("dialog",dialog=>dialog.accept());await row(version.id).getByRole("button",{name:`Xóa mẫu ${tag} phần môn`,exact:true}).click();await expect(row(version.id).getByRole("alert")).toContainText("Không thể xóa mẫu");expect(await db.surveyTemplate.count({where:{id:version.id}})).toBe(1);await expect(row(version.id)).toContainText("Được dùng trong 1 đợt");await expect(row(version.id).getByRole("button",{name:`Xóa mẫu ${tag} phần môn`,exact:true})).toBeDisabled();
    await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:".playwright-cli/template-library-mobile.png",fullPage:true});
  });
});
