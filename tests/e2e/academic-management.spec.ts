import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";
import { randomUUID } from "node:crypto";

test.use({ actionTimeout: 15000 });
test("hướng dẫn theo quyền, sửa xóa học vụ và biểu đồ tiến độ không lộ câu trả lời", async ({ page }) => {
  test.skip(!process.env.ISOLATED_FEATURE_DB, "Chỉ chạy trên database nghiệm thu riêng.");
  test.setTimeout(150000);
  expect(new URL(process.env.DATABASE_URL!).pathname).toBe(`/${process.env.ISOLATED_FEATURE_DB}`);
  const db = new PrismaClient(), tag = `EDIT-${randomUUID().slice(0, 6)}`.toUpperCase(), password = randomUUID();
  const userIds: string[] = [];
  let facultyId = "", semesterId = "", homeId = "", courseId = "", groupId = "", templateId = "", campaignId = "";
  async function login(email: string) {
    await page.context().clearCookies(); await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email); await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await page.waitForURL(/\/(admin|student|lecturer|dean)$/, { timeout: 15000 });
  }
  async function edit(title: string) {
    const dialog = page.getByRole("dialog", { name: title, exact: true, includeHidden: true });
    await page.locator("tr, section.question").filter({ has: dialog }).getByRole("button", { name: "Sửa nhanh", exact: true }).click();
    return page.locator("dialog[open]");
  }
  page.on("dialog", dialog => void dialog.accept());
  const errors: string[] = []; page.on("pageerror", e => errors.push(`${page.url()}: ${e.message}`));
  try {
    const passwordHash = await hash(password);
    const faculty = await db.faculty.create({ data: { code: tag, name: `Khoa ${tag}` } }); facultyId = faculty.id;
    const semester = await db.semester.create({ data: { name: tag, startsAt: new Date("2026-01-01T00:00:00+07:00"), endsAt: new Date("2026-06-01T23:59:59.999+07:00") } }); semesterId = semester.id;
    const home = await db.academicClass.create({ data: { code: tag, name: tag, facultyId } }); homeId = home.id;
    const course = await db.course.create({ data: { code: tag, name: tag, facultyId } }); courseId = course.id;
    const group = await db.courseClass.create({ data: { code: tag, courseId, semesterId } }); groupId = group.id;
    const admin = await db.user.create({ data: { name: tag, email: `${tag}-admin@example.invalid`, passwordHash, roles: { create: { role: "ADMIN" } } } }); userIds.push(admin.id);
    const student = await db.user.create({ data: { name: tag, email: `${tag}-sv@example.invalid`, passwordHash, roles: { create: { role: "STUDENT" } }, student: { create: { studentCode: tag, academicClassId: homeId } } }, include: { student: true } }); userIds.push(student.id);
    const lecturer = await db.user.create({ data: { name: tag, email: `${tag}-gv@example.invalid`, passwordHash, roles: { create: { role: "LECTURER" } }, lecturer: { create: { lecturerCode: tag, facultyId } } } }); userIds.push(lecturer.id);
    const dean = await db.user.create({ data: { name: tag, email: `${tag}-tk@example.invalid`, passwordHash, roles: { create: [{ role: "DEAN" }, { role: "LECTURER" }] }, lecturer: { create: { lecturerCode: `${tag}-TK`, facultyId } } } }); userIds.push(dean.id);
    for (const [user, title] of [[student, "Sinh viên"], [lecturer, "Giảng viên"], [dean, "Trưởng khoa"], [admin, "Quản trị viên"]] as const) {
      await login(user.email); await page.goto("/help");
      await expect(page.getByRole("heading", { name: "Hướng dẫn sử dụng", exact: true })).toBeVisible();
      await expect(page.locator("main").getByRole("heading", { name: title, exact: true })).toBeVisible();
      if (title !== "Quản trị viên") await expect(page.locator('main a[href^="/admin"]')).toHaveCount(0);
    }
    await page.goto("/admin/academic");
    let dialog = await edit(`Sửa học kỳ ${tag}`);
    await dialog.getByLabel("Tên học kỳ", { exact: true }).fill(`${tag} đã sửa`);
    await dialog.getByRole("button", { name: "Lưu học kỳ", exact: true }).click();
    await expect(dialog.getByRole("status")).toHaveText("Đã cập nhật danh mục.");
    expect((await db.semester.findUniqueOrThrow({ where: { id: semesterId } })).name).toBe(`${tag} đã sửa`);
    await dialog.getByRole("button", { name: "Đóng chỉnh sửa" }).click();
    dialog = await edit(`Sửa lớp hành chính ${tag}`);
    await dialog.getByLabel("Tên lớp hành chính", { exact: true }).fill(`${tag} đã sửa`);
    await dialog.getByRole("button", { name: "Lưu lớp hành chính", exact: true }).click();
    await expect(dialog.getByRole("status")).toHaveText("Đã cập nhật danh mục.");
    await dialog.getByRole("button", { name: "Xóa lớp hành chính", exact: true }).click();
    await expect(dialog.getByRole("status").last()).toContainText("Không thể xóa lớp hành chính còn sinh viên");
    await page.goto("/admin/classes/new");
    dialog = await edit(`Sửa môn học ${tag}`);
    await dialog.getByLabel("Tên môn học", { exact: true }).fill(`${tag} đã sửa`);
    await dialog.getByRole("button", { name: "Lưu môn học", exact: true }).click();
    await expect(dialog.getByRole("status")).toHaveText("Đã cập nhật danh mục.");
    await dialog.getByRole("button", { name: "Đóng chỉnh sửa" }).click();
    dialog = await edit(`Sửa lớp học phần ${tag}`);
    await dialog.getByLabel("Sĩ số", { exact: true }).fill("35");
    await dialog.getByRole("button", { name: "Lưu lớp học phần", exact: true }).click();
    await expect(dialog.getByRole("status")).toHaveText("Đã cập nhật danh mục.");
    expect((await db.courseClass.findUniqueOrThrow({ where: { id: groupId } })).capacity).toBe(35);
    await dialog.getByRole("button", { name: "Xóa lớp học phần", exact: true }).click();
    await expect.poll(() => db.courseClass.count({ where: { id: groupId } })).toBe(0);
    dialog = await edit(`Sửa môn học ${tag}`);
    await dialog.getByRole("button", { name: "Xóa môn học", exact: true }).click();
    await expect.poll(() => db.course.count({ where: { id: courseId } })).toBe(0);
    await page.goto("/admin/academic"); dialog = await edit(`Sửa học kỳ ${tag} đã sửa`);
    await dialog.getByRole("button", { name: "Xóa học kỳ", exact: true }).click();
    await expect.poll(() => db.semester.count({ where: { id: semesterId } })).toBe(0);
    // Remove the fixture student only after testing the dependency guard.
    await db.user.delete({ where: { id: student.id } });
    dialog = await edit(`Sửa lớp hành chính ${tag}`);
    await dialog.getByRole("button", { name: "Xóa lớp hành chính", exact: true }).click();
    await expect.poll(() => db.academicClass.count({ where: { id: homeId } })).toBe(0);

    const template = await db.surveyTemplate.create({ data: { title: tag, questions: { create: { content: "Chất lượng hỗ trợ", type: "SCALE", position: 1 } } }, include: { questions: true } }); templateId = template.id;
    const campaign = await db.surveyCampaign.create({ data: { title: tag, scope: "UNIVERSITY", templateId, status: "CLOSED", startsAt: new Date("2026-01-01"), endsAt: new Date("2026-06-01") } }); campaignId = campaign.id;
    for (let i = 0; i < 3; i++) {
      const u = await db.user.create({ data: { name: `${tag}-${i}`, email: `${tag}-${i}@example.invalid`, passwordHash, roles: { create: { role: "STUDENT" } }, student: { create: { studentCode: `${tag}-${i}` } } }, include: { student: true } }); userIds.push(u.id);
      await db.surveyParticipation.create({ data: { campaignId, studentId: u.student!.id, status: i < 2 ? "COMPLETED" : "DRAFT" } });
      if (i < 2) await db.submission.create({ data: { campaignId, answers: { create: { questionId: template.questions[0].id, value: "4" } } } });
    }
    await page.goto(`/admin/campaigns/${campaignId}/report`);
    await expect(page.getByRole("img", { name: "2/3 hoàn thành, 1 đang làm, 0 chưa bắt đầu", exact: true })).toBeVisible();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
    await expect(page.locator("#ket-qua .report-score")).toContainText("4");
    await page.getByLabel("Tìm lớp hoặc khoa", { exact: true }).fill("không có lớp");
    await expect(page.getByText("Không có lớp phù hợp bộ lọc.", { exact: true })).toBeVisible();
    for (const width of [320, 390, 1280]) { await page.setViewportSize({ width, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }
    await db.surveyCampaign.update({ where: { id: campaignId }, data: { status: "PUBLISHED", endsAt: new Date(Date.now() + 86400000) } });
    await page.reload(); await expect(page.locator("#ket-qua")).toContainText("Báo cáo chỉ có sau khi khảo sát đóng hoặc hết hạn."); await expect(page.locator(".report-score")).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {
    await db.surveyCampaign.deleteMany({ where: { id: campaignId } });
    await db.surveyTemplate.deleteMany({ where: { id: templateId } });
    await db.courseClass.deleteMany({ where: { id: groupId } }); await db.course.deleteMany({ where: { id: courseId } });
    await db.auditLog.deleteMany({ where: { actorId: { in: userIds } } }); await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.academicClass.deleteMany({ where: { id: homeId } }); await db.semester.deleteMany({ where: { id: semesterId } }); await db.faculty.deleteMany({ where: { id: facultyId } });
    await db.$disconnect();
  }
});
