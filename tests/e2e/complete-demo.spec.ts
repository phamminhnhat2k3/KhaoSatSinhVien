import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";
import { randomUUID } from "node:crypto";
import { resetCompleteDemo } from "../../prisma/complete-demo-service";
import { completeDemoPassword, completeStudents, completeTeachers } from "../../prisma/complete-demo-data";

test.describe("bộ demo mới trên database nghiệm thu riêng", () => {
  test.skip(!process.env.ISOLATED_FEATURE_DB, "Không reset database ứng dụng trong bài test.");
  test.setTimeout(180000);
  const db = new PrismaClient(), email = `RESET-${randomUUID()}@example.invalid`;
  let adminId: string, oldId: string;
  let seeded: Awaited<ReturnType<typeof resetCompleteDemo>>;
  test.beforeAll(async () => {
    expect(new URL(process.env.DATABASE_URL!).pathname).toBe(`/${process.env.ISOLATED_FEATURE_DB}`);
    const passwordHash = await hash(completeDemoPassword);
    adminId = (await db.user.create({ data: { email, name: "Admin kiểm thử reset", passwordHash, roles: { create: { role: "ADMIN" } } } })).id;
    oldId = (await db.user.create({ data: { email: `OLD-${randomUUID()}@example.invalid`, name: "Tài khoản cũ cần xóa", passwordHash, roles: { create: { role: "STUDENT" } } } })).id;
    const admins = await db.user.findMany({ where: { roles: { some: { role: "ADMIN" } } }, select: { id: true } });
    const hashes = new Map([...admins, ...completeStudents, ...completeTeachers].map(a => [a.id, passwordHash]));
    seeded = await resetCompleteDemo(db, hashes);
  });
  test.afterAll(async () => {
    await db.user.updateMany({ where: { id: { in: [...completeStudents, ...completeTeachers].map(a => a.id) } }, data: { active: false } });
    await db.$disconnect();
  });
  async function login(page: Page, account: string) {
    await page.context().clearCookies(); await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(account); await page.getByLabel("Mật khẩu", { exact: true }).fill(completeDemoPassword);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(page).not.toHaveURL(/\/login$/);
  }
  test("giữ Admin, xóa tài khoản cũ, đủ dữ liệu và đăng nhập đúng bốn vai trò", async ({ page }) => {
    expect(await db.user.findUnique({ where: { id: oldId } })).toBeNull();
    expect((await db.user.findUniqueOrThrow({ where: { id: adminId } })).email).toBe(email);
    expect(await db.studentProfile.count()).toBe(75); expect(await db.academicClass.count()).toBe(15); expect(await db.semester.count()).toBe(2);
    expect(await db.surveyCampaign.count()).toBe(20); expect(await db.submission.count()).toBe(170);
    await login(page, email); await expect(page).toHaveURL(/\/admin$/);
    const closed = seeded.campaigns.find(c => c.kind === "closed" && c.facultyId === "demo-khoa-cntt")!;
    expect((await page.request.get(`/api/reports/campaigns/${closed.id}/export`)).status()).toBe(200);
    await page.goto(`/admin/campaigns/${closed.id}/report`); await expect(page.getByRole("heading", { name: "Kết quả tổng hợp", exact: true })).toBeVisible();
    await login(page, "sv.cntt01@demo.vn"); await expect(page).toHaveURL(/\/student$/);
    const open = seeded.campaigns.find(c => c.kind === "open" && c.facultyId === "demo-khoa-cntt")!;
    const survey = await (await page.request.get(`/api/surveys/${open.id}`)).json();
    expect(new Set(survey.questions.map((q: { courseId: string | null }) => q.courseId).filter(Boolean)).size).toBe(4);
    await page.goto(`/student/surveys/${open.id}`); await expect(page.getByRole("button", { name: "Lưu bản nháp", exact: true })).toBeVisible();
    await login(page, "gv.cntt2@demo.vn"); await expect(page).toHaveURL(/\/lecturer$/);
    await page.goto(`/lecturer?campaign=${closed.id}`); await expect(page.locator("#ket-qua")).toContainText("Kết quả");
    await login(page, "tk.cntt@demo.vn"); await expect(page).toHaveURL(/\/dean$/);
    await page.goto(`/dean?campaign=${closed.id}`); await expect(page.locator("#ket-qua")).toContainText("Kết quả");
    const foreign = seeded.campaigns.find(c => c.kind === "closed" && c.facultyId === "demo-khoa-ck")!;
    expect((await page.request.get(`/api/reports/campaigns/${foreign.id}`)).status()).toBe(400);
  });
});
