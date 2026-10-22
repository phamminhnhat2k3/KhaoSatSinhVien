import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";
import { randomUUID } from "node:crypto";
import { loadEnvFile } from "node:process";

test.describe("trang học vụ và ghi danh", () => {
  test.skip(!process.env.RUN_FEATURE_E2E, "Bật RUN_FEATURE_E2E để chạy với dữ liệu riêng.");
  test.setTimeout(60000);
  test.use({ actionTimeout: 15000 });
  const tag = `ACA-${randomUUID().slice(0, 8)}`.toUpperCase(), password = randomUUID();
  const adminEmail = `${tag}-admin@example.invalid`, studentEmail = `${tag}-student@example.invalid`;
  let db: PrismaClient, adminId: string, lecturerId: string, lecturerUserId: string, semesterId: string;
  test.beforeAll(async () => {
    loadEnvFile(".env"); db = new PrismaClient();
    const passwordHash = await hash(password);
    adminId = (await db.user.create({ data: { name: tag, email: adminEmail, passwordHash, roles: { create: { role: "ADMIN" } } } })).id;
    const teacher = await db.user.create({ data: { name: tag, email: `${tag}-lecturer@example.invalid`, passwordHash, roles: { create: { role: "LECTURER" } }, lecturer: { create: { lecturerCode: tag } } }, include: { lecturer: true } });
    lecturerUserId = teacher.id; lecturerId = teacher.lecturer!.id;
    semesterId = (await db.semester.create({ data: { name: tag, startsAt: new Date("2026-01-01"), endsAt: new Date("2027-01-01") } })).id;
  });
  test.afterAll(async () => {
    if (!db) return;
    await db.courseClass.deleteMany({ where: { code: { in: [`${tag}.01`, `${tag}.02`] } } });
    await db.course.deleteMany({ where: { code: tag } });
    if (semesterId) await db.semester.delete({ where: { id: semesterId } });
    const ids = [adminId, lecturerUserId].filter(Boolean);
    await db.auditLog.deleteMany({ where: { actorId: { in: ids } } });
    await db.user.deleteMany({ where: { OR: [{ id: { in: ids } }, { email: studentEmail.toLowerCase() }] } });
    await db.$disconnect();
  });
  test("tạo lớp, không ghi đè tên học phần cũ, tạo tài khoản và ghi danh thật", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(adminEmail);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto("/admin/classes/new");
    async function fillClass(name: string, code: string) {
      await page.getByLabel("Mã học phần", { exact: true }).fill(tag);
      await page.getByLabel("Tên học phần", { exact: true }).fill(name);
      await page.getByLabel("Mã lớp", { exact: true }).fill(code);
      await page.getByRole("combobox", { name: "Học kỳ", exact: true }).selectOption(semesterId);
      await page.getByRole("combobox", { name: "Giảng viên", exact: true }).selectOption(lecturerId);
      await page.getByRole("button", { name: "Tạo lớp học phần", exact: true }).click();
    }
    await fillClass(`Học phần ${tag}`, `${tag}.01`);
    await expect(page.getByRole("status")).toHaveText("Đã tạo lớp học phần.");
    const courseClass = await db.courseClass.findUniqueOrThrow({ where: { code: `${tag}.01` } });
    await fillClass("Tên không được ghi đè", `${tag}.02`);
    await expect(page.locator("main").getByRole("alert")).toContainText("Mã học phần đã có tên khác");
    expect((await db.course.findUniqueOrThrow({ where: { code: tag } })).name).toBe(`Học phần ${tag}`);
    await page.goto("/admin/students/new");
    await page.getByLabel("Họ tên", { exact: true }).fill(`Sinh viên ${tag}`);
    await page.getByLabel("Mã sinh viên", { exact: true }).fill(tag);
    await page.getByLabel("Email", { exact: true }).fill(studentEmail);
    await page.getByLabel("Mật khẩu khởi tạo", { exact: true }).fill(password);
    await page.getByRole("combobox", { name: "Ghi danh vào lớp", exact: true }).selectOption(courseClass.id);
    await page.getByRole("button", { name: "Tạo và ghi danh sinh viên", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("Đã tạo tài khoản sinh viên và ghi danh thành công.");
    const student = await db.studentProfile.findUniqueOrThrow({ where: { studentCode: tag }, include: { user: { include: { roles: true } }, enrollments: true } });
    expect(student.user.roles.map(r => r.role)).toEqual(["STUDENT"]);
    expect(student.enrollments.map(e => e.classId)).toEqual([courseClass.id]);
  });
});
