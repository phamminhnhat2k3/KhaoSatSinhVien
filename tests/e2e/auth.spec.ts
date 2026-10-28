import { expect, test } from "@playwright/test";

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

test.describe("ba hành trình nghiệp vụ với dữ liệu seed", () => {
  test.skip(!process.env.RUN_DB_E2E, "Đặt RUN_DB_E2E=1 sau khi khởi tạo MySQL và seed.");
  const password = process.env.SEED_PASSWORD ?? "";

  async function login(page: import("@playwright/test").Page, email: string) {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mật khẩu").fill(password);
    await page.getByRole("button", { name: "Đăng nhập" }).click();
  }

  test("quản trị viên tạo và công bố đợt khảo sát", async ({ page }) => {
    await login(page, "admin@demo.vn");
    await expect(page.getByText("Trung tâm điều hành")).toBeVisible();
    await page.getByRole("link", { name: /Tạo đợt mới/ }).click();
    await page.getByLabel("Tên đợt khảo sát").fill(`Nghiệm thu ${Date.now()}`);
    await page.getByRole("combobox", { name: "Phạm vi khảo sát", exact: true }).selectOption("UNIVERSITY");
    await page.getByRole("combobox", { name: "Mẫu câu hỏi chung", exact: true }).selectOption({ index: 1 });
    await page.getByRole("button", { name: "Tạo đợt khảo sát" }).click();
    await page.getByRole("link", { name: "Xem và công bố" }).first().click();
    await page.getByRole("button", { name: "Công bố", exact: true }).click();
    await expect(page.getByText("Đã công bố", { exact: true }).first()).toBeVisible();
  });

  test("sinh viên lưu nháp và gửi phản hồi", async ({ page }) => {
    await login(page, "sinhvien1@demo.vn");
    await page.getByRole("link", { name: "Thực hiện khảo sát" }).first().click();
    await page.locator('input[type="radio"][value="5"]').first().check();
    await page.locator('input[type="radio"]').nth(5).check();
    await page.locator('input[type="checkbox"]').first().check();
    await page.getByRole("button", { name: "Lưu bản nháp" }).click();
    await expect(page.getByText("Đã lưu bản nháp.")).toBeVisible();
    await page.getByRole("button", { name: "Gửi phản hồi" }).click();
    await expect(page.getByText("Phản hồi đã được ghi nhận ẩn danh.")).toBeVisible();
  });

  test("giảng viên xem báo cáo không có danh tính sinh viên", async ({ page }) => {
    await login(page, "giangvien@demo.vn");
    await page.getByText("Khảo sát học phần đã hoàn tất").click();
    await expect(page.getByText("Báo cáo tổng hợp")).toBeVisible();
    await expect(page.getByText("Phản hồi ẩn danh")).toBeVisible();
    await expect(page.getByText(/sinhvien\d@demo\.vn/)).toHaveCount(0);
  });
});
