import {expect,test} from "@playwright/test";
import {PrismaClient} from "@prisma/client";
import {hash} from "argon2";
import {randomUUID} from "node:crypto";

test.describe("quản lý vòng đời khảo sát",()=>{
  test.skip(!process.env.ISOLATED_FEATURE_DB,"Chạy trên database nghiệm thu riêng.");
  const db=new PrismaClient();const tag=`LIFE-${randomUUID().slice(0,6)}`;const password=randomUUID();let campaignId:string,adminId:string;
  test.beforeAll(async()=>{
    expect(new URL(process.env.DATABASE_URL!).pathname).toBe(`/${process.env.ISOLATED_FEATURE_DB}`);
    adminId=(await db.user.create({data:{name:tag,email:`${tag}@example.invalid`,passwordHash:await hash(password),roles:{create:{role:"ADMIN"}}}})).id;
    const semester=await db.semester.create({data:{name:tag,startsAt:new Date("2026-01-01"),endsAt:new Date("2027-01-01")}});
    const template=await db.surveyTemplate.create({data:{title:tag,questions:{create:{content:"Đánh giá chung",type:"SCALE",position:1}}}});
    campaignId=(await db.surveyCampaign.create({data:{title:tag,scope:"UNIVERSITY",semesterId:semester.id,templateId:template.id,startsAt:new Date("2026-01-01"),endsAt:new Date("2027-01-01"),approvedAt:new Date(),approvedBy:adminId}})).id;
  });
  test.afterAll(async()=>{await db.user.updateMany({where:{name:{startsWith:tag}},data:{active:false}});await db.$disconnect();});
  test("sửa nháp, tạo bản sao, hủy có xác nhận và không sửa được đợt đã đóng",async({page})=>{
    await page.goto("/login");await page.getByLabel("Email",{exact:true}).fill(`${tag}@example.invalid`);await page.getByLabel("Mật khẩu",{exact:true}).fill(password);await page.getByRole("button",{name:"Đăng nhập",exact:true}).click();await expect(page).toHaveURL(/\/admin$/);
    await page.goto(`/admin/campaigns/new?edit=${campaignId}`);
    await expect(page.getByLabel("Tên đợt khảo sát")).toHaveValue(tag);
    await page.getByLabel("Tên đợt khảo sát").fill(`${tag} đã sửa`);await page.getByRole("button",{name:"Lưu bản nháp",exact:true}).click();await expect(page).toHaveURL(/review\?saved=1/);
    expect((await db.surveyCampaign.findUniqueOrThrow({where:{id:campaignId}})).approvedAt).toBeNull();
    await page.goto(`/admin/campaigns/new?copy=${campaignId}`);await expect(page.getByLabel("Tên đợt khảo sát")).toHaveValue(`Bản sao · ${tag} đã sửa`);
    await page.getByRole("button",{name:"Tạo đợt khảo sát",exact:true}).click();await expect(page).toHaveURL(/created=1/);
    const copy=await db.surveyCampaign.findFirstOrThrow({where:{title:`Bản sao · ${tag} đã sửa`}});expect(copy.status).toBe("DRAFT");expect(await db.surveyParticipation.count({where:{campaignId:copy.id}})).toBe(0);
    await page.goto(`/admin/campaigns/${copy.id}/review`);await page.getByText("Hủy đợt khảo sát",{exact:true}).click();await page.getByRole("checkbox",{name:/Tôi xác nhận/}).check();await page.getByRole("button",{name:"Hủy bản nháp",exact:true}).click();await expect(page).toHaveURL(/status=CANCELLED/);expect((await db.surveyCampaign.findUniqueOrThrow({where:{id:copy.id}})).status).toBe("CANCELLED");
    await db.surveyCampaign.update({where:{id:campaignId},data:{status:"CLOSED"}});await page.goto(`/admin/campaigns/new?edit=${campaignId}`);await expect(page.getByRole("button",{name:"Lưu bản nháp",exact:true})).toHaveCount(0);
    const campaign=await db.surveyCampaign.findUniqueOrThrow({where:{id:campaignId},include:{template:{include:{questions:true}}}});
    for(let i=0;i<2;i++){
      const student=await db.user.create({data:{name:`${tag} SV${i}`,email:`${tag}-${i}@example.invalid`,passwordHash:await hash(password),roles:{create:{role:"STUDENT"}},student:{create:{studentCode:`${tag}-${i}`}}},include:{student:true}});
      await db.surveyParticipation.create({data:{campaignId,studentId:student.student!.id,status:"COMPLETED"}});
      await db.submission.create({data:{campaignId,answers:{create:{questionId:campaign.template.questions[0].id,value:String(4+i)}}}});
    }
    await page.goto(`/admin/campaigns/${campaignId}/report`);await expect(page.getByRole("region",{name:"Báo cáo tổng hợp",exact:true})).toBeVisible();await expect(page.locator("main")).toContainText("4.5");await expect(page.getByRole("link",{name:"Xuất CSV",exact:true})).toBeVisible();
    const csv=await page.request.get(`/api/reports/campaigns/${campaignId}/export`);expect(csv.status()).toBe(200);expect(await csv.text()).toContain("Số người trả lời câu này");
    await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:".playwright-cli/admin-report-mobile.png",fullPage:true});
    await db.surveyCampaign.update({where:{id:campaignId},data:{status:"PUBLISHED",startsAt:new Date(Date.now()-3*86400000),endsAt:new Date(Date.now()-86400000)}});
    const scheduled=await db.surveyCampaign.create({data:{title:`${tag} chờ`,scope:"UNIVERSITY",templateId:campaign.templateId,semesterId:campaign.semesterId,status:"PUBLISHED",startsAt:new Date(Date.now()+86400000),endsAt:new Date(Date.now()+3*86400000)}});
    await page.goto("/admin?status=EXPIRED");await expect(page.getByRole("heading",{name:`${tag} đã sửa`,exact:true})).toBeVisible();await expect(page.getByRole("heading",{name:scheduled.title,exact:true})).toHaveCount(0);
    await page.goto("/admin?status=SCHEDULED");await expect(page.getByRole("heading",{name:scheduled.title,exact:true})).toBeVisible();
    await page.goto(`/admin/campaigns/${campaignId}/report`);await expect(page.getByRole("region",{name:"Báo cáo tổng hợp",exact:true})).toBeVisible();
  });
});
