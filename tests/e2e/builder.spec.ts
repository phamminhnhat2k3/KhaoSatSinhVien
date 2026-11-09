import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";
import { randomUUID } from "node:crypto";
import { loadEnvFile } from "node:process";
import {templateDraftKey} from "../../src/modules/templates/draft";

test.describe("nghiệm thu trình dựng với dữ liệu riêng", () => {
  test.skip(!process.env.RUN_FEATURE_E2E, "Đặt RUN_FEATURE_E2E=1 để tạo dữ liệu kiểm thử riêng trong MySQL.");
  test.setTimeout(90000);
  test.use({actionTimeout:15000});
  const tag = `E2E-${randomUUID().slice(0, 8)}`;
  const password = randomUUID();
  let db: PrismaClient;
  let userId: string;
  let otherUserId:string,sourceId:string;
  test.beforeAll(async () => {
    loadEnvFile(".env"); db = new PrismaClient();
    const user = await db.user.create({ data: { name: "Quản trị kiểm thử", email: `${tag}@example.invalid`, passwordHash: await hash(password), roles: { create: { role: "ADMIN" } } } });
    userId = user.id;
    otherUserId=(await db.user.create({data:{name:"Quản trị khác",email:`${tag}-other@example.invalid`,passwordHash:await hash(password),roles:{create:{role:"ADMIN"}}}})).id;
    sourceId=(await db.surveyTemplate.create({data:{title:`${tag} bản gốc`,questions:{create:{content:"Nội dung gốc",type:"TEXT",position:1}}}})).id;
  });
  test.afterAll(async () => {
    if (!db) return;
    if (userId) {
      const logs = await db.auditLog.findMany({ where: { actorId: userId, entity: "SurveyTemplate" }, select: { entityId: true } });
      await db.surveyTemplate.deleteMany({ where: { id: { in: [...logs.map(l => l.entityId),sourceId] } } });
      await db.auditLog.deleteMany({ where: { actorId: userId } });
      await db.user.delete({ where: { id: userId } });
      if(otherUserId)await db.user.delete({where:{id:otherUserId}});
    }
    await db.$disconnect();
  });
  async function login(page:import("@playwright/test").Page,other=false){
    await page.context().clearCookies();await page.goto("/login");await page.getByLabel("Email",{exact:true}).fill(`${tag}${other?"-other":""}@example.invalid`);await page.getByLabel("Mật khẩu",{exact:true}).fill(password);await page.getByRole("button",{name:"Đăng nhập",exact:true}).click();await expect(page).toHaveURL(/\/admin$/);
  }
  test("khôi phục nháp chưa hoàn chỉnh, tách tài khoản/mẫu và giữ công cụ khi cuộn",async({page})=>{
    await login(page);await page.setViewportSize({width:1440,height:1000});await page.goto("/admin/templates/new");
    await expect(page.getByRole("complementary",{name:"Thông tin tài khoản",exact:true})).toHaveCount(0);
    await expect(page.getByRole("navigation",{name:"Điều hướng soạn mẫu",exact:true})).toBeVisible();
    await page.getByLabel("Tên mẫu khảo sát",{exact:true}).fill(`${tag} đang soạn`);
    await page.getByRole("button",{name:/Nhiều lựa chọn/}).click();await page.getByRole("textbox",{name:"Nội dung câu 1",exact:true}).fill("Nội dung chưa hoàn chỉnh");await page.getByLabel("Lựa chọn 1 của câu 1",{exact:true}).fill("Tài liệu");
    await page.getByRole("button",{name:/Thang điểm/}).click();await page.getByLabel("Điểm cao nhất",{exact:true}).fill("100");
    await expect(page.getByRole("status")).toContainText("Đã lưu nháp");await page.reload();
    await expect(page.getByRole("status")).toContainText("Đã khôi phục");await expect(page.getByLabel("Tên mẫu khảo sát",{exact:true})).toHaveValue(`${tag} đang soạn`);await expect(page.getByLabel("Lựa chọn 1 của câu 1",{exact:true})).toHaveValue("Tài liệu");await expect(page.getByLabel("Lựa chọn 2 của câu 1",{exact:true})).toHaveValue("");await expect(page.getByLabel("Điểm cao nhất",{exact:true})).toHaveValue("100");
    await page.goto(`/admin/templates/new?copy=${sourceId}`);await expect(page.getByLabel("Tên mẫu khảo sát",{exact:true})).toHaveValue(`${tag} bản gốc (bản sao)`);await page.getByLabel("Tên mẫu khảo sát",{exact:true}).fill(`${tag} nháp bản sao`);await expect(page.getByRole("status")).toContainText("Đã lưu nháp");
    await login(page,true);await page.goto("/admin/templates/new");await expect(page.getByLabel("Tên mẫu khảo sát",{exact:true})).toHaveValue("");
    await login(page);await page.goto("/admin/templates/new");await expect(page.getByLabel("Tên mẫu khảo sát",{exact:true})).toHaveValue(`${tag} đang soạn`);
    for(let i=0;i<12;i++)await page.getByRole("button",{name:/Tự luận/}).click();
    await page.locator(".question-editor").last().scrollIntoViewIfNeeded();
    const toolbar=await page.locator(".builder-toolbar").boundingBox(),toolbox=await page.locator(".toolbox").boundingBox();
    expect(toolbar!.y).toBeGreaterThanOrEqual(0);expect(toolbar!.y).toBeLessThan(20);expect(toolbox!.y).toBeGreaterThanOrEqual(toolbar!.y+toolbar!.height);
    await page.screenshot({path:".playwright-cli/builder-focused-desktop.png"});
    for(const width of [390,320]){
      await page.setViewportSize({width,height:844});await page.locator(".question-editor").last().scrollIntoViewIfNeeded();
      await expect(page.locator(".toolbox")).toBeHidden();await expect(page.getByRole("button",{name:"Thêm Tự luận",exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      const sticky=await page.locator(".builder-toolbar").boundingBox();expect(sticky!.y).toBeLessThan(20);expect(sticky!.height).toBeLessThan(300);
      await page.screenshot({path:`.playwright-cli/builder-focused-${width}.png`});
    }
    await page.getByRole("button",{name:"Thêm Tự luận",exact:true}).click();await expect(page.locator(".question-editor")).toHaveCount(15);await expect(page.getByRole("status")).toContainText("Đã lưu nháp");
    page.once("dialog",dialog=>dialog.accept());await page.getByRole("button",{name:"Bỏ bản nháp",exact:true}).click();await expect(page.locator(".question-editor")).toHaveCount(0);expect(await page.evaluate(key=>localStorage.getItem(key),templateDraftKey(userId))).toBeNull();
  });
  test("cảnh báo khi lưu nháp lỗi, giữ nội dung khi máy chủ lỗi và xóa nháp sau khi lưu mẫu",async({page})=>{
    await login(page);await page.goto("/admin/templates/new");await page.getByLabel("Tên mẫu khảo sát",{exact:true}).fill(`${tag} bảo vệ nháp`);await page.getByRole("button",{name:/Tự luận/}).click();await page.getByRole("textbox",{name:"Nội dung câu 1",exact:true}).fill("Nội dung đã lưu nháp");await expect(page.getByRole("status")).toContainText("Đã lưu nháp");
    await page.evaluate(()=>{const original=Storage.prototype.setItem;(window as typeof window&{restoreDraftStorage:()=>void}).restoreDraftStorage=()=>{Storage.prototype.setItem=original;};Storage.prototype.setItem=function(key,value){if(key.startsWith("survey-template-draft:"))throw new DOMException("Storage blocked","QuotaExceededError");return original.call(this,key,value);};});
    await page.getByRole("textbox",{name:"Nội dung câu 1",exact:true}).fill("Nội dung mới cần được bảo vệ");await expect(page.getByRole("status")).toContainText("Không thể tự lưu nháp");
    page.once("dialog",dialog=>dialog.dismiss());await page.getByRole("link",{name:"← Thư viện mẫu",exact:true}).click();await expect(page).toHaveURL(/\/admin\/templates\/new$/);await expect(page.getByRole("textbox",{name:"Nội dung câu 1",exact:true})).toHaveValue("Nội dung mới cần được bảo vệ");
    page.once("dialog",dialog=>dialog.dismiss());await page.getByRole("button",{name:"Đăng xuất",exact:true}).click();await expect(page).toHaveURL(/\/admin\/templates\/new$/);
    expect(await page.evaluate(()=>{const event=new Event("beforeunload",{cancelable:true});window.dispatchEvent(event);return event.defaultPrevented;})).toBe(true);
    const failSave=async(route:import("@playwright/test").Route)=>{if(route.request().method()==="POST")await route.fulfill({status:500,body:"Unavailable"});else await route.continue();};
    await page.route("**/admin/templates/new",failSave);await page.getByRole("button",{name:"Lưu mẫu khảo sát",exact:true}).click();await expect(page.locator("main").getByRole("alert")).toContainText("Chưa lưu được mẫu");expect(await page.evaluate(key=>localStorage.getItem(key),templateDraftKey(userId))).not.toBeNull();
    await page.unroute("**/admin/templates/new",failSave);await page.evaluate(()=>(window as typeof window&{restoreDraftStorage:()=>void}).restoreDraftStorage());
    await page.getByRole("button",{name:"Lưu mẫu khảo sát",exact:true}).click();await expect(page).toHaveURL(/\/admin\/templates\?saved=1$/);expect(await page.evaluate(key=>localStorage.getItem(key),templateDraftKey(userId))).toBeNull();
    const saved=await db.surveyTemplate.findFirstOrThrow({where:{title:`${tag} bảo vệ nháp`},include:{questions:true}});expect(saved.questions[0].content).toBe("Nội dung mới cần được bảo vệ");
  });
  test("kéo thả, sửa thang 100, xem trước và lưu đủ bốn loại câu", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(`${tag}@example.invalid`);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.getByText("Quản lý và thiết lập", { exact: true }).click();
    await page.getByRole("link", { name: /Tạo mẫu khảo sát/ }).click();
    await page.getByRole("button", { name: /Thang điểm/ }).dragTo(page.locator(".drop-zone"));
    await expect(page.getByText("Câu 1 · Thang điểm", { exact: true })).toBeVisible();
    await page.getByLabel("Tên mẫu khảo sát", { exact: true }).fill(tag);
    const longContent = `Mức độ hài lòng với học phần? ${"Nội dung chi tiết. ".repeat(14)}`;
    await page.getByRole("textbox",{name:"Nội dung câu 1",exact:true}).fill(longContent);
    await page.getByLabel("Mẫu thang điểm").selectOption("100");
    await page.getByRole("button", { name: /Một lựa chọn/ }).click();
    await page.getByRole("textbox",{name:"Nội dung câu 2",exact:true}).fill("Hình thức học tập phù hợp?");
    const longOption = "A".repeat(200);
    await page.getByLabel("Lựa chọn 1 của câu 2", { exact: true }).fill(longOption);
    await page.getByLabel("Lựa chọn 2 của câu 2", { exact: true }).fill("Trực tuyến");
    await page.getByRole("button", { name: /Nhiều lựa chọn/ }).click();
    await page.getByRole("textbox",{name:"Nội dung câu 3",exact:true}).fill("Những nội dung cần cải thiện?");
    await page.getByLabel("Lựa chọn 1 của câu 3", { exact: true }).fill("Tài liệu");
    await page.getByLabel("Lựa chọn 2 của câu 3", { exact: true }).fill("Thực hành");
    await page.getByRole("button", { name: /Tự luận/ }).click();
    await page.getByRole("textbox",{name:"Nội dung câu 4",exact:true}).fill("Đề xuất của bạn cho học phần?");
    await page.getByRole("button", { name: "Đưa câu 4 lên", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Nội dung câu 3", exact: true })).toHaveValue("Đề xuất của bạn cho học phần?");
    await page.getByRole("button", { name: "Xem trước", exact: true }).click();
    await expect(page.getByRole("spinbutton", { name: "Điểm từ 1 đến 100" })).toHaveAttribute("max", "100");
    await page.getByRole("button", { name: "Tiếp tục chỉnh sửa" }).click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: ".playwright-cli/builder-desktop.png", fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: ".playwright-cli/builder-mobile.png", fullPage: true });
    await page.getByRole("button", { name: "Lưu mẫu khảo sát", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("Đã lưu mẫu khảo sát thành công.");
    const template = await db.surveyTemplate.findFirstOrThrow({ where: { title: tag }, include: { questions: { orderBy: { position: "asc" }, include: { options: true } } } });
    expect(template.questions.map(q => q.type)).toEqual(["SCALE", "SINGLE", "TEXT", "MULTIPLE"]);
    expect(template.questions[0].scaleMax).toBe(100);
    expect(template.questions[0].content).toBe(longContent.trim());
    expect(template.questions[1].options).toHaveLength(2);
    expect(template.questions[1].options.some(o => o.label === longOption)).toBe(true);
    const invalid = await page.request.post("/api/admin/templates", { data: { title: tag, questions: [] } });
    expect(invalid.status()).toBe(400);
  });
});
