import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";
import { randomUUID } from "node:crypto";

test.describe("hệ học của lớp hành chính", () => {
  test.skip(!process.env.ISOLATED_FEATURE_DB, "Chỉ chạy trong database nghiệm thu riêng.");
  const db = new PrismaClient(), tag = `EDU-${randomUUID().slice(0, 6)}`, password = randomUUID();
  let facultyId: string, semesterId: string;
  test.beforeAll(async () => {
    expect(new URL(process.env.DATABASE_URL!).pathname).toBe(`/${process.env.ISOLATED_FEATURE_DB}`);
    await db.user.create({ data: { name: tag, email: `${tag}@example.invalid`, passwordHash: await hash(password), roles: { create: { role: "ADMIN" } } } });
    facultyId = (await db.faculty.create({ data: { code: tag, name: tag } })).id;
    semesterId = (await db.semester.create({ data: { name: tag, startsAt: new Date("2026-01-01"), endsAt: new Date("2027-12-31") } })).id;
  });
  test.afterAll(async () => { await db.user.updateMany({ where: { name: tag }, data: { active: false } }); await db.$disconnect(); });
  test("tạo ba hệ, đổi hệ lớp cũ và nhận biết trong phân công và tạo đợt", async ({ page }) => {
    await page.goto("/login"); await page.getByLabel("Email", { exact: true }).fill(`${tag}@example.invalid`); await page.getByLabel("Mật khẩu", { exact: true }).fill(password); await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(page).toHaveURL(/\/admin$/);
    for (const [system, short] of [["REGULAR", "CQ"], ["PART_TIME", "VLVH"], ["DISTANCE", "ĐTTX"]]) {
      await page.goto("/admin/academic");
      await page.getByRole("combobox", { name: "Khoa của lớp", exact: true }).selectOption(facultyId);
      await page.getByRole("combobox", { name: "Hệ học của lớp", exact: true }).selectOption(system);
      await page.getByLabel("Mã lớp hành chính", { exact: true }).fill(`${tag}-${system}`);
      await page.getByLabel("Tên lớp hành chính", { exact: true }).fill(`Lớp ${tag} ${short}`);
      await page.getByRole("button", { name: "Tạo lớp hành chính", exact: true }).click();
      await expect.poll(async () => (await db.academicClass.findUnique({ where: { code: `${tag}-${system}`.toUpperCase() } }))?.educationSystem).toBe(system);
      await expect(page.locator("tbody tr").filter({ hasText: `Lớp ${tag} ${short}` })).toContainText(short);
    }
    const code = `${tag}-REGULAR`.toUpperCase();
    const row = page.locator("tbody tr").filter({ hasText: code });
    await row.getByRole("combobox", { name: `Hệ học lớp ${code}`, exact: true }).selectOption("DISTANCE");
    await row.getByRole("button", { name: "Lưu hệ học", exact: true }).click();
    await expect.poll(async () => (await db.academicClass.findUnique({where:{code}}))?.educationSystem).toBe("DISTANCE");
    const saved = await db.academicClass.findUniqueOrThrow({ where: { code } });
    expect(saved).toMatchObject({ code, name: `Lớp ${tag} CQ`, educationSystem: "DISTANCE" });
    await page.goto("/admin/assignments");
    await page.getByRole("combobox", { name: "Học kỳ phân công", exact: true }).selectOption(semesterId);
    await page.getByRole("combobox", { name: "Khoa của lớp", exact: true }).selectOption(facultyId);
    await expect(page.locator(`select[name="academicClassId"] option[value="${saved.id}"]`)).toContainText("[ĐTTX]");
    await page.goto("/admin/campaigns/new");
    await page.getByRole("combobox", { name: "Học kỳ khảo sát", exact: true }).selectOption(semesterId);
    await page.getByRole("combobox", { name: "Khoa tổ chức", exact: true }).selectOption(facultyId);
    await expect(page.locator(`label`).filter({ has: page.locator(`input[name="academicClassIds"][value="${saved.id}"]`) })).toContainText("[ĐTTX]");
  });
});
