import { expect, test, type Page } from "@playwright/test";
import { PrismaClient, type Role } from "@prisma/client";
import { hash } from "argon2";
import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { loadEnvFile } from "node:process";

test.describe("hồ sơ, thông báo và khảo sát xuyên vai trò", () => {
  test.skip(!process.env.RUN_FEATURE_E2E, "Chỉ chạy khi bật dữ liệu nghiệm thu riêng.");
  test.setTimeout(120000);
  test.use({ actionTimeout: 15000 });
  const tag = `ROLE-${randomUUID().slice(0, 8)}`, password = randomUUID();
  let db: PrismaClient;
  const users: { id: string; email: string; role: Role }[] = [];
  let semesterId: string, courseId: string, classId: string, templateId: string;
  let questions: { id: string; type: string }[];
  test.beforeAll(async () => {
    loadEnvFile(".env"); db = new PrismaClient();
    const passwordHash = await hash(password);
    for (const [index, role] of (["ADMIN", "LECTURER", "STUDENT", "STUDENT", "STUDENT", "STUDENT", "STUDENT"] as Role[]).entries()) {
      const user = await db.user.create({ data: { name: `${tag} ${role} ${index}`, email: `${tag}-${index}@example.invalid`, passwordHash, roles: { create: { role } }, ...(role === "STUDENT" ? { student: { create: { studentCode: `${tag}-${index}` } } } : role === "LECTURER" ? { lecturer: { create: { lecturerCode: tag } } } : {}) } });
      users.push({ id: user.id, email: user.email, role });
    }
    const teacher = await db.lecturerProfile.findUniqueOrThrow({ where: { userId: users[1].id } });
    semesterId = (await db.semester.create({ data: { name: tag, startsAt: new Date("2026-01-01"), endsAt: new Date("2027-01-01") } })).id;
    courseId = (await db.course.create({ data: { code: tag, name: tag } })).id;
    classId = (await db.courseClass.create({ data: { code: tag, courseId, semesterId, lecturerId: teacher.id } })).id;
    const students = await db.studentProfile.findMany({ where: { userId: { in: users.slice(2).map(u => u.id) } } });
    await db.enrollment.createMany({ data: students.map(s => ({ classId, studentId: s.id })) });
    const template = await db.surveyTemplate.create({ data: { title: tag, questions: { create: [
      { content: "Điểm hài lòng", type: "SCALE", position: 1, scaleMin: 0, scaleMax: 100, scaleStep: 10 },
      { content: "Điểm cần cải thiện", type: "MULTIPLE", position: 2, options: { create: [{ label: "Tài liệu", value: "material", position: 1 }, { label: "Thực hành", value: "practice", position: 2 }] } }
    ] } }, include: { questions: { orderBy: { position: "asc" } } } });
    templateId = template.id; questions = template.questions;
  });
  test.afterAll(async () => {
    if (!db) return;
    const campaigns = await db.surveyCampaign.findMany({ where: { templateId }, select: { id: true } });
    if (templateId) {
      await db.submission.deleteMany({ where: { campaignId: { in: campaigns.map(c => c.id) } } });
      await db.surveyCampaign.deleteMany({ where: { templateId } });
      await db.surveyTemplate.delete({ where: { id: templateId } });
    }
    if (classId) await db.courseClass.delete({ where: { id: classId } });
    if (courseId) await db.course.delete({ where: { id: courseId } });
    if (semesterId) await db.semester.delete({ where: { id: semesterId } });
    await db.auditLog.deleteMany({ where: { actorId: { in: users.map(u => u.id) } } });
    await db.user.deleteMany({ where: { id: { in: users.map(u => u.id) } } });
    for (const u of users) await unlink(join(process.cwd(), ".data", "avatars", `${u.id}.img`)).catch(()=>{});
    await db.$disconnect();
  });
  async function login(page: Page, index: number, loginPassword = password) {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(users[index].email);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(loginPassword);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${users[index].role === "ADMIN" ? "admin" : users[index].role === "LECTURER" ? "lecturer" : "student"}$`));
  }
  test("hồ sơ đúng vai trò, công bố/đóng gửi thông báo, thang 100 được báo cáo chính xác", async ({ page }) => {
    await login(page, 0);
    const students = await db.studentProfile.findMany({ where: { userId: { in: users.slice(2).map(u => u.id) } } });
    await db.surveyCampaign.create({ data: { title: tag, templateId, startsAt: new Date("2026-01-01"), endsAt: new Date("2027-01-01"), targets: { create: { classId } }, participations: { create: students.map(s => ({ studentId: s.id })) } } });
    await page.goto("/admin");
    const row = page.locator("section.question").filter({ has: page.getByRole("heading", { name: tag, exact: true }) });
    await row.getByRole("link", { name: "Xem và công bố", exact: true }).click();
    await page.getByRole("button", { name: "Công bố", exact: true }).click();
    await expect(row.getByText("Đã công bố", { exact: true })).toBeVisible();
    const campaign = await db.surveyCampaign.findFirstOrThrow({ where: { templateId } });
    expect(await db.notification.count({ where: { userId: { in: users.map(u => u.id) } } })).toBe(7);
    await page.goto("/notifications");
    await page.getByRole("button", { name: "Đánh dấu tất cả đã đọc" }).click();
    await expect(page.getByText("0 thông báo chưa đọc", { exact: true })).toBeVisible();
    expect(await db.notification.count({ where: { userId: users[2].id, readAt: null } })).toBe(1);
    for (const index of [0, 1, 2]) {
      if (index) await login(page, index);
      await page.goto("/profile");
      await expect(page.getByText(users[index].email, { exact: true })).toBeVisible();
      if (index === 0) {
        const png = await page.evaluate(() => { const canvas = document.createElement("canvas"); canvas.width = 160; canvas.height = 80; const ctx = canvas.getContext("2d")!; ctx.fillStyle = "#0a66c2"; ctx.fillRect(0,0,40,80); return canvas.toDataURL("image/png").split(",")[1]; });
        await page.getByLabel("Ảnh đại diện", { exact: true }).setInputFiles({ name: "avatar.png", mimeType: "image/png", buffer: Buffer.from(png, "base64") });
        await expect(page.getByRole("img", {name:"Xem trước ảnh đại diện"})).toBeVisible();
        await page.getByLabel("Phóng to ảnh", {exact:true}).focus();
        await page.keyboard.press("End");
        await expect(page.getByLabel("Phóng to ảnh", {exact:true})).toHaveValue("3");
        const preview=await page.locator(".avatar-crop").boundingBox();
        await page.mouse.move(preview!.x+120,preview!.y+120);await page.mouse.down();await page.mouse.move(preview!.x+160,preview!.y+160);await page.mouse.up();
        expect(Number(await page.getByLabel("Vị trí ngang", {exact:true}).inputValue())).toBeLessThan(0);
        await page.getByRole("button", {name:"Căn giữa lại",exact:true}).click();
        await expect(page.getByLabel("Phóng to ảnh", {exact:true})).toHaveValue("1");
        await expect(page.getByLabel("Vị trí ngang", {exact:true})).toHaveValue("0");
        await page.getByLabel("Phóng to ảnh", {exact:true}).focus();await page.keyboard.press("Home");
        await expect(page.getByLabel("Phóng to ảnh", {exact:true})).toHaveValue("0.1");
        await page.setViewportSize({width:390,height:844});
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
        await page.screenshot({path:".playwright-cli/avatar-crop-mobile.png",fullPage:true});
        await page.setViewportSize({width:1440,height:1000});
        await page.getByRole("button", { name: "Lưu ảnh đại diện", exact: true }).click();
        await expect(page.getByText("Đã cập nhật ảnh đại diện.", { exact: true })).toBeVisible();
        const avatar = await page.request.get(`/api/avatars?id=${users[0].id}`);
        expect(avatar.status()).toBe(200); expect(avatar.headers()["content-type"]).toBe("image/webp");
        await page.reload();
        await expect(page.locator(".profile-avatar img")).toBeVisible();
        await expect.poll(()=>page.locator(".profile-avatar img").evaluate((el: HTMLImageElement)=>el.naturalWidth)).toBeGreaterThan(0);
        await expect(page.locator(".profile-avatar .avatar-initial")).toBeHidden();
      }
      await page.getByLabel("Khoa / đơn vị").fill(`Đơn vị ${index}`);
      await page.getByLabel("Giới thiệu", { exact: true }).fill("Hồ sơ nghiệm thu riêng, không gắn với phản hồi.");
      await page.getByLabel("Màu ảnh bìa").selectOption("violet");
      await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
      await expect(page.getByRole("status")).toHaveText("Đã cập nhật hồ sơ của bạn.");
      await expect(page.getByRole("combobox", { name: "Màu ảnh bìa", exact: true })).toHaveValue("violet");
      expect((await db.user.findUniqueOrThrow({ where: { id: users[index].id } })).department).toBe(`Đơn vị ${index}`);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: ".playwright-cli/profile-desktop.png", fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const countResponse = await page.request.get("/api/notifications");
    expect(await countResponse.json()).toMatchObject({ unread: 1 });
    expect((await page.request.get("/api/admin/templates")).status()).toBe(403);
    await page.goto(`/student/surveys/${campaign.id}`);
    await page.getByRole("radio", { name: "100", exact: true }).check();
    await page.getByRole("checkbox", { name: "Tài liệu", exact: true }).check();
    await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("Đã lưu bản nháp.");
    await expect(page.getByRole("radio", { name: "100", exact: true })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: "Tài liệu", exact: true })).toBeChecked();
    await page.reload();
    await expect(page.getByRole("radio", { name: "100", exact: true })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: "Tài liệu", exact: true })).toBeChecked();
    await page.getByRole("button", { name: "Gửi phản hồi", exact: true }).click();
    await expect(page).toHaveURL(/submitted=1/);
    const submission = await db.submission.findFirstOrThrow({ where: { campaignId: campaign.id } });
    await page.goto(`/admin/campaigns/${campaign.id}/responses/${submission.id}`);
    await expect(page).toHaveURL(/\/unauthorized$/);
    await login(page, 0);
    await expect(page.getByRole("img", { name: /HCM-UTE/ })).toBeVisible();
    await row.getByRole("link", { name: "Xem bài đánh giá (1)", exact: true }).click();
    await page.getByRole("link", { name: /Phiếu 1/ }).click();
    await expect(page.locator(".submitted-answer").first()).toHaveText("100 điểm · Thang 0–100");
    await expect(page.locator(".submitted-answer").nth(1)).toHaveText("Tài liệu");
    await expect(page.locator("main")).not.toContainText(users[2].email);
    await expect(page.locator("main")).not.toContainText(`${tag} STUDENT 2`);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: ".playwright-cli/admin-submission.png", fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const missing = await page.goto(`/admin/campaigns/not-this-campaign/responses/${submission.id}`);
    expect(missing?.status()).toBe(404);
    for (const index of [3, 4, 5, 6]) {
      await login(page, index);
      const response = await page.request.post(`/api/surveys/${campaign.id}/submit`, { data: { [questions[0].id]: "100", [questions[1].id]: ["material"] } });
      expect(response.status()).toBe(201);
    }
    await login(page, 0);
    await row.getByRole("button", { name: "Đóng khảo sát", exact: true }).click();
    await expect(row.getByText("Đã đóng", { exact: true })).toBeVisible();
    expect(await db.notification.count({ where: { userId: { in: users.map(u => u.id) } } })).toBe(14);
    await login(page, 1);
    await page.goto(`/admin/campaigns/${campaign.id}/responses/${submission.id}`);
    await expect(page).toHaveURL(/\/unauthorized$/);
    const report = await page.request.get(`/api/reports/campaigns/${campaign.id}`);
    expect(report.status()).toBe(200);
    const json = await report.json();
    expect(json.questions[0].average).toBe(100);
    expect(json.questions[0].scaleMax).toBe(100);
    expect(JSON.stringify(json)).not.toContain("example.invalid");
    await page.goto("/notifications");
    await expect(page.getByRole("heading", { name: "Đợt khảo sát đã đóng", exact: true })).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: ".playwright-cli/notifications-desktop.png", fullPage: true });
    await page.goto("/profile");
    const newPassword = randomUUID();
    await page.getByLabel("Mật khẩu hiện tại", { exact: true }).fill("incorrect-password");
    await page.getByLabel("Mật khẩu mới", { exact: true }).fill(newPassword);
    await page.getByLabel("Xác nhận mật khẩu mới", { exact: true }).fill(newPassword);
    await page.getByRole("button", { name: "Đổi mật khẩu", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("Mật khẩu hiện tại không đúng.");
    await page.getByLabel("Mật khẩu hiện tại", { exact: true }).fill(password);
    await page.getByLabel("Mật khẩu mới", { exact: true }).fill(newPassword);
    await page.getByLabel("Xác nhận mật khẩu mới", { exact: true }).fill(newPassword);
    await page.getByRole("button", { name: "Đổi mật khẩu", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("Đã đổi mật khẩu. Dùng mật khẩu mới cho lần đăng nhập tiếp theo.");
    await login(page, 1, newPassword);
  });
});
