import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";
import { randomUUID } from "node:crypto";

test.describe("thông báo thao tác admin", () => {
  test.skip(!process.env.ISOLATED_FEATURE_DB, "Chỉ chạy trên database nghiệm thu riêng.");
  test.setTimeout(90000); test.use({actionTimeout:15000});
  const db = new PrismaClient(), tag = `TOAST-${randomUUID().slice(0, 6)}`, password = randomUUID();
  test.beforeAll(async () => {
    expect(new URL(process.env.DATABASE_URL!).pathname).toBe(`/${process.env.ISOLATED_FEATURE_DB}`);
    await db.user.create({ data: { name: tag, email: `${tag}@example.invalid`, passwordHash: await hash(password), roles: { create: { role: "ADMIN" } } } });
  });
  test.afterAll(async () => { await db.$disconnect(); });
  test("xếp chồng, tự tắt riêng sau 5 giây, sửa trong popup, lỗi và chuyển trang", async ({ page }) => {
    await page.goto("/login"); await page.getByLabel("Email", { exact: true }).fill(`${tag}@example.invalid`); await page.getByLabel("Mật khẩu", { exact: true }).fill(password); await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(page).toHaveURL(/\/admin$/);
    await page.goto("/admin/academic");
    await page.clock.install(); await page.clock.pauseAt(new Date());
    const create = page.locator("form").filter({ has: page.getByRole("button", { name: "Tạo khoa", exact: true }) });
    await create.getByLabel("Mã khoa").fill(tag); await create.getByLabel("Tên khoa").fill(tag); await create.getByRole("button", { name: "Tạo khoa", exact: true }).click();
    const toasts = page.getByTestId("action-toast"); await expect(toasts).toHaveCount(1); await expect(toasts.first()).toContainText("Đã tạo khoa.");
    const bounds = await toasts.first().boundingBox(); expect(bounds!.x + bounds!.width).toBeGreaterThan(1200); expect(bounds!.y + bounds!.height).toBeGreaterThan(680);
    await page.clock.runFor(2000);
    await create.getByLabel("Mã khoa").fill(tag); await create.getByLabel("Tên khoa").fill(tag);
    await create.getByRole("button", { name: "Tạo khoa", exact: true }).click(); await expect(toasts).toHaveCount(2); await expect(toasts.last()).toContainText("Chưa thực hiện được");
    expect((await toasts.first().boundingBox())!.y).toBeLessThan((await toasts.last().boundingBox())!.y);
    await page.clock.runFor(3001); await expect(toasts).toHaveCount(1); await expect(toasts.first()).toContainText("Chưa thực hiện được");
    await toasts.first().getByRole("button", { name: "Đóng thông báo thao tác" }).click(); await expect(toasts).toHaveCount(0);
    const faculty = page.locator("section.question").filter({ has: page.getByRole("button", { name: tag, exact: true }) });
    await faculty.getByRole("button", { name: "Sửa nhanh", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: `Sửa khoa ${tag}`, exact: true });
    await dialog.getByLabel("Tên khoa").fill(`${tag} mới`); await dialog.getByRole("button", { name: "Lưu khoa", exact: true }).click(); await expect(toasts).toHaveCount(1);
    await toasts.first().getByRole("button", { name: "Đóng thông báo thao tác" }).click(); await expect(toasts).toHaveCount(0);
    await page.getByRole("dialog").getByRole("button", { name: "Đóng chỉnh sửa" }).click();
    await page.goto("/admin/templates/new"); await page.getByLabel("Tên mẫu khảo sát", { exact: true }).fill(tag); await page.getByRole("button", { name: /Tự luận/ }).click(); await page.getByRole("textbox", { name: "Nội dung câu 1", exact: true }).fill("Góp ý của bạn"); await page.getByRole("button", { name: "Lưu mẫu khảo sát", exact: true }).click(); await expect(page).toHaveURL(/saved=1/); await expect(toasts).toContainText("Đã tạo mẫu khảo sát.");
    await toasts.getByRole("button", { name: "Đóng thông báo thao tác" }).click();
    page.once("dialog", dialog => dialog.accept()); await page.getByRole("button", { name: `Xóa mẫu ${tag}`, exact: true }).click(); await expect(page).toHaveURL(/deleted=1/); await expect(toasts).toContainText("Đã xóa mẫu khảo sát.");
    await page.clock.runFor(5001); await expect(toasts).toHaveCount(0); await page.reload(); await expect(toasts).toHaveCount(0);
  });
});
