import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";
import { randomUUID } from "node:crypto";
import { loadEnvFile } from "node:process";

test.describe("nghiệm thu trình dựng với dữ liệu riêng", () => {
  test.skip(!process.env.RUN_FEATURE_E2E, "Đặt RUN_FEATURE_E2E=1 để tạo dữ liệu kiểm thử riêng trong MySQL.");
  const tag = `E2E-${randomUUID().slice(0, 8)}`;
  const password = randomUUID();
  let db: PrismaClient;
  let userId: string;
  test.beforeAll(async () => {
    loadEnvFile(".env"); db = new PrismaClient();
    const user = await db.user.create({ data: { name: "Quản trị kiểm thử", email: `${tag}@example.invalid`, passwordHash: await hash(password), roles: { create: { role: "ADMIN" } } } });
    userId = user.id;
  });
  test.afterAll(async () => {
    if (!db) return;
    if (userId) {
      const logs = await db.auditLog.findMany({ where: { actorId: userId, entity: "SurveyTemplate" }, select: { entityId: true } });
      await db.surveyTemplate.deleteMany({ where: { id: { in: logs.map(l => l.entityId) } } });
      await db.auditLog.deleteMany({ where: { actorId: userId } });
      await db.user.delete({ where: { id: userId } });
    }
    await db.$disconnect();
  });
  test("kéo thả, sửa thang 100, xem trước và lưu đủ bốn loại câu", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(`${tag}@example.invalid`);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.getByRole("link", { name: /Tạo mẫu khảo sát/ }).click();
    await page.getByRole("button", { name: /Thang điểm/ }).dragTo(page.locator(".drop-zone"));
    await page.getByLabel("Tên mẫu khảo sát", { exact: true }).fill(tag);
    await page.getByLabel("Nội dung câu 1", { exact: true }).fill("Mức độ hài lòng với học phần?");
    await page.getByLabel("Mẫu thang điểm").selectOption("100");
    await page.getByRole("button", { name: /Một lựa chọn/ }).click();
    await page.getByLabel("Nội dung câu 2", { exact: true }).fill("Hình thức học tập phù hợp?");
    await page.getByLabel("Lựa chọn 1 của câu 2", { exact: true }).fill("Trực tiếp");
    await page.getByLabel("Lựa chọn 2 của câu 2", { exact: true }).fill("Trực tuyến");
    await page.getByRole("button", { name: /Nhiều lựa chọn/ }).click();
    await page.getByLabel("Nội dung câu 3", { exact: true }).fill("Những nội dung cần cải thiện?");
    await page.getByLabel("Lựa chọn 1 của câu 3", { exact: true }).fill("Tài liệu");
    await page.getByLabel("Lựa chọn 2 của câu 3", { exact: true }).fill("Thực hành");
    await page.getByRole("button", { name: /Tự luận/ }).click();
    await page.getByLabel("Nội dung câu 4", { exact: true }).fill("Đề xuất của bạn cho học phần?");
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
    expect(template.questions[1].options).toHaveLength(2);
    const invalid = await page.request.post("/api/admin/templates", { data: { title: tag, questions: [] } });
    expect(invalid.status()).toBe(400);
  });
});
