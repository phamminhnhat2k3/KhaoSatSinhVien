import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";
import { randomUUID } from "node:crypto";

test("trang đăng nhập hiển thị biểu mẫu truy cập được", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Mật khẩu")).toBeVisible();
  await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("font-family", /Segoe UI/);
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel("Email").fill("kiemtra@example.com");
  await expect(page.getByLabel("Email")).toHaveValue("kiemtra@example.com");
});

test.describe("ba hành trình nghiệp vụ với dữ liệu riêng", () => {
  test.skip(!process.env.ISOLATED_FEATURE_DB, "Chạy qua test:e2e:isolated.");
  const db=new PrismaClient(),tag=`AUTH-${randomUUID().slice(0,6)}`,password=randomUUID();
  let liveId:string;
  test.beforeAll(async()=>{
    expect(new URL(process.env.DATABASE_URL!).pathname).toBe(`/${process.env.ISOLATED_FEATURE_DB}`);
    const passwordHash=await hash(password);
    await db.user.create({data:{email:`${tag}-admin@example.invalid`,name:tag,passwordHash,roles:{create:{role:"ADMIN"}}}});
    const teacher=await db.user.create({data:{email:`${tag}-teacher@example.invalid`,name:tag,passwordHash,roles:{create:{role:"LECTURER"}},lecturer:{create:{lecturerCode:tag}}},include:{lecturer:true}});
    const student=await db.user.create({data:{email:`${tag}-student@example.invalid`,name:tag,passwordHash,roles:{create:{role:"STUDENT"}},student:{create:{studentCode:tag}}},include:{student:true}});
    const semester=await db.semester.create({data:{name:tag,startsAt:new Date("2026-01-01"),endsAt:new Date("2027-12-31")}});
    const course=await db.course.create({data:{code:tag,name:tag}});
    const group=await db.courseClass.create({data:{code:tag,courseId:course.id,semesterId:semester.id,lecturerId:teacher.lecturer!.id}});
    const template=await db.surveyTemplate.create({data:{title:tag,questions:{create:{content:"Đánh giá chung",type:"SCALE",position:1}}},include:{questions:true}});
    const common={templateId:template.id,startsAt:new Date("2026-01-01"),endsAt:new Date("2027-12-31")};
    liveId=(await db.surveyCampaign.create({data:{...common,title:`${tag} đang mở`,status:"PUBLISHED",participations:{create:{studentId:student.student!.id}},targets:{create:{classId:group.id}}}})).id;
    await db.surveyCampaign.create({data:{...common,title:`${tag} đã hoàn tất`,status:"CLOSED",targets:{create:{classId:group.id}},submissions:{create:[{answers:{create:{questionId:template.questions[0].id,value:"5"}}},{answers:{create:{questionId:template.questions[0].id,value:"4"}}}]}}});
  });
  test.afterAll(async()=>{await db.user.updateMany({where:{name:{startsWith:tag}},data:{active:false}});await db.$disconnect();});
  async function login(page:import("@playwright/test").Page,role:string) {
    await page.goto("/login");await page.getByLabel("Email",{exact:true}).fill(`${tag}-${role}@example.invalid`);await page.getByLabel("Mật khẩu",{exact:true}).fill(password);await page.getByRole("button",{name:"Đăng nhập",exact:true}).click();await expect(page).not.toHaveURL(/\/login$/);
  }
  test("quản trị viên tạo và công bố đợt khảo sát",async({page})=>{
    await login(page,"admin");await page.goto("/admin/campaigns/new");await page.getByLabel("Tên đợt khảo sát").fill(`${tag} mới`);await page.getByRole("combobox",{name:"Phạm vi khảo sát",exact:true}).selectOption("UNIVERSITY");await page.getByRole("combobox",{name:"Mẫu câu hỏi chung",exact:true}).selectOption({label:`${tag} · 1 câu`});await page.getByRole("button",{name:"Tạo đợt khảo sát",exact:true}).click();await expect(page).toHaveURL(/created=1/);const campaign=await db.surveyCampaign.findFirstOrThrow({where:{title:`${tag} mới`}});await page.goto(`/admin/campaigns/${campaign.id}/review`);await page.getByRole("button",{name:"Công bố",exact:true}).click();await expect(page).toHaveURL(/published=1/);expect((await db.surveyCampaign.findUniqueOrThrow({where:{id:campaign.id}})).status).toBe("PUBLISHED");
  });
  test("sinh viên lưu nháp và gửi phản hồi",async({page})=>{
    await login(page,"student");await page.goto(`/student/surveys/${liveId}`);await page.locator('input[type="radio"][value="5"]').check();await page.getByRole("button",{name:"Lưu bản nháp",exact:true}).click();await expect(page.getByText("Đã lưu bản nháp.",{exact:true})).toBeVisible();await page.getByRole("button",{name:"Gửi phản hồi",exact:true}).click();await expect(page.getByText(/Phản hồi đã được ghi nhận ẩn danh/)).toBeVisible();
  });
  test("giảng viên xem báo cáo không có danh tính sinh viên",async({page})=>{
    await login(page,"teacher");await page.getByText(`${tag} đã hoàn tất`,{exact:true}).click();await expect(page.getByText("Báo cáo tổng hợp",{exact:true})).toBeVisible();await expect(page.getByText("Phản hồi ẩn danh",{exact:true})).toBeVisible();await expect(page.getByText(`${tag}-student@example.invalid`,{exact:true})).toHaveCount(0);
  });
});
