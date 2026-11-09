import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";
import { randomUUID } from "node:crypto";

test.use({ actionTimeout: 15000 });
test("cảnh báo rời trang, lưu nháp, bỏ thay đổi và lưu hồ sơ theo bốn vai trò", async ({ page }) => {
  test.skip(!process.env.ISOLATED_FEATURE_DB, "Chỉ chạy trên database nghiệm thu riêng.");
  test.setTimeout(180000);
  expect(new URL(process.env.DATABASE_URL!).pathname).toBe(`/${process.env.ISOLATED_FEATURE_DB}`);
  const db = new PrismaClient(), tag = `LEAVE-${randomUUID().slice(0, 6)}`, password = randomUUID(), ids: string[] = [];
  let facultyId = "", semesterId = "", templateId = "", campaignId = "";
  const popup = page.getByRole("dialog", { name: "Thay đổi chưa lưu", exact: true });
  const errors: string[] = []; page.on("pageerror", error => errors.push(`${page.url()}: ${error.message}`));
  const home = () => page.locator("header.nav").getByRole("link", { name: "Trang chủ", exact: true });
  async function login(email: string) {
    await page.context().clearCookies(); await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email); await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await page.waitForURL(/\/(admin|student|lecturer|dean)$/, { timeout: 15000 });
  }
  try {
    const passwordHash = await hash(password);
    const faculty = await db.faculty.create({ data: { code: tag, name: tag } }); facultyId = faculty.id;
    const semester = await db.semester.create({ data: { name: tag, startsAt: new Date("2026-01-01"), endsAt: new Date("2027-01-01") } }); semesterId = semester.id;
    const admin = await db.user.create({ data: { name: tag, email: `${tag}-admin@example.invalid`, passwordHash, roles: { create: { role: "ADMIN" } } } }); ids.push(admin.id);
    await db.notification.create({ data: { userId: admin.id, title: `${tag} điều hướng`, body: "Kiểm tra rời biểu mẫu qua thông báo", href: "/help", readAt: new Date() } });
    const student = await db.user.create({ data: { name: tag, email: `${tag}-sv@example.invalid`, passwordHash, roles: { create: { role: "STUDENT" } }, student: { create: { studentCode: tag } } }, include: { student: true } }); ids.push(student.id);
    const teacher = await db.user.create({ data: { name: tag, email: `${tag}-gv@example.invalid`, passwordHash, roles: { create: { role: "LECTURER" } }, lecturer: { create: { lecturerCode: tag, facultyId } } } }); ids.push(teacher.id);
    const dean = await db.user.create({ data: { name: tag, email: `${tag}-tk@example.invalid`, passwordHash, roles: { create: [{ role: "LECTURER" }, { role: "DEAN" }] }, lecturer: { create: { lecturerCode: `${tag}-tk`, facultyId } } } }); ids.push(dean.id);
    const template = await db.surveyTemplate.create({ data: { title: tag, questions: { create: [{ content: "Góp ý đang viết", type: "TEXT", position: 1 }, { content: "Điểm", type: "SCALE", position: 2 }] } }, include: { questions: { orderBy: { position: "asc" } } } }); templateId = template.id;
    const campaign = await db.surveyCampaign.create({ data: { title: tag, scope: "UNIVERSITY", templateId, status: "PUBLISHED", startsAt: new Date(Date.now() - 86400000), endsAt: new Date(Date.now() + 86400000), participations: { create: { studentId: student.student!.id } } } }); campaignId = campaign.id;
    await login(admin.email); await page.goto("/admin/campaigns/new");
    await page.getByLabel("Tên đợt khảo sát", { exact: true }).fill(`${tag} chưa đủ dữ liệu`);
    await home().click(); await expect(popup).toBeVisible();
    await popup.getByRole("button", { name: "Tiếp tục chỉnh sửa", exact: true }).click();
    await expect(page.getByLabel("Tên đợt khảo sát", { exact: true })).toHaveValue(`${tag} chưa đủ dữ liệu`);
    await page.locator("header.nav").getByRole("button", { name: /^Thông báo/ }).click();
    await page.getByRole("dialog", { name: "Thông báo nhanh", exact: true }).getByRole("button", { name: "Xem chi tiết →", exact: true }).click();
    await expect(popup).toBeVisible(); await popup.getByRole("button", { name: "Tiếp tục chỉnh sửa", exact: true }).click(); await expect(page).toHaveURL(/\/admin\/campaigns\/new$/);
    await page.goBack(); await expect(popup).toBeVisible();
    await popup.getByRole("button", { name: "Tiếp tục chỉnh sửa", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/campaigns\/new$/);
    await home().click(); await popup.getByRole("button", { name: "Lưu nháp và rời trang", exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);
    expect(await db.surveyCampaign.count({ where: { title: `${tag} chưa đủ dữ liệu` } })).toBe(0);
    await page.goto("/admin/campaigns/new"); await expect(page.getByLabel("Tên đợt khảo sát", { exact: true })).toHaveValue(`${tag} chưa đủ dữ liệu`);
    await page.getByLabel("Tên đợt khảo sát", { exact: true }).fill(`${tag} bỏ`);
    await home().click(); await popup.getByRole("button", { name: "Bỏ thay đổi và rời trang", exact: true }).click(); await expect(page).toHaveURL(/\/admin$/);
    await page.goto("/admin/campaigns/new"); await expect(page.getByLabel("Tên đợt khảo sát", { exact: true })).toHaveValue("");
    await page.getByLabel("Tên đợt khảo sát", { exact: true }).fill(`${tag} giữ khi lỗi`);
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error("storage blocked"); }; Storage.prototype.removeItem = () => { throw new Error("storage blocked"); }; });
    await home().click(); await popup.getByRole("button", { name: "Lưu nháp và rời trang", exact: true }).click();
    await expect(popup.getByRole("alert")).toBeVisible(); await expect(page).toHaveURL(/\/admin\/campaigns\/new$/);
    await popup.getByRole("button", { name: "Bỏ thay đổi và rời trang", exact: true }).click(); await expect(page).toHaveURL(/\/admin$/);

    await page.goto("/admin/campaigns/new");
    await page.getByLabel("Tên đợt khảo sát", { exact: true }).fill(`${tag} tạo thành công`);
    await page.getByRole("combobox", { name: "Phạm vi khảo sát", exact: true }).selectOption("UNIVERSITY");
    await page.getByRole("combobox", { name: "Học kỳ khảo sát", exact: true }).selectOption(semesterId);
    await page.getByRole("combobox", { name: "Mẫu câu hỏi chung", exact: true }).selectOption(templateId);
    await home().click(); await popup.getByRole("button", { name: "Lưu nháp và rời trang", exact: true }).click(); await expect(page).toHaveURL(/\/admin$/);
    await page.goto("/admin/campaigns/new"); await page.getByRole("button", { name: "Tạo đợt khảo sát", exact: true }).click(); await expect(page).toHaveURL(/created=1/);
    expect(await page.evaluate(key => localStorage.getItem(key), `campaign-draft:${admin.id}:new`)).toBeNull();
    await page.goto("/admin/academic");
    const facultyCreate = page.locator("section.card").filter({ has: page.getByRole("heading", { name: "Thêm khoa", exact: true }) });
    await facultyCreate.getByLabel("Tên khoa", { exact: true }).fill(`${tag} tạo còn dở`);
    const facultyRow = page.locator("section.question").filter({ has: page.getByRole("button", { name: tag, exact: true }) });
    await facultyRow.getByRole("button", { name: "Sửa nhanh", exact: true }).click();
    const edit = page.getByRole("dialog", { name: `Sửa khoa ${tag}`, exact: true });
    await edit.getByLabel("Tên khoa", { exact: true }).fill(`${tag} chưa lưu`); await edit.getByRole("button", { name: "Đóng chỉnh sửa", exact: true }).click();
    await expect(popup).toBeVisible(); await popup.getByRole("button", { name: "Tiếp tục chỉnh sửa", exact: true }).click(); await expect(edit).toBeVisible();
    await edit.getByRole("button", { name: "Đóng chỉnh sửa", exact: true }).click(); await popup.getByRole("button", { name: "Bỏ thay đổi và rời trang", exact: true }).click(); await expect(edit).toBeHidden();
    expect((await db.faculty.findUniqueOrThrow({ where: { id: facultyId } })).name).toBe(tag);
    await home().click(); await expect(popup).toBeVisible(); await popup.getByRole("button", { name: "Bỏ thay đổi và rời trang", exact: true }).click(); await expect(page).toHaveURL(/\/admin$/);
    await page.goto("/admin/users"); await page.getByLabel("Tìm người dùng", { exact: true }).fill("bộ lọc không phải biểu mẫu"); await home().click(); await expect(page).toHaveURL(/\/admin$/); await expect(popup).toBeHidden();
    await page.goto("/admin/campaigns/new"); await page.getByLabel("Tên đợt khảo sát", { exact: true }).fill(`${tag} không tải lại`);
    let browserWarning = "";
    page.once("dialog", async dialog => { browserWarning = dialog.type(); await dialog.dismiss(); });
    await page.evaluate(() => location.reload()); await expect.poll(() => browserWarning).toBe("beforeunload");
    await expect(page.getByLabel("Tên đợt khảo sát", { exact: true })).toHaveValue(`${tag} không tải lại`);
    await home().click(); await popup.getByRole("button", { name: "Bỏ thay đổi và rời trang", exact: true }).click(); await expect(page).toHaveURL(/\/admin$/);

    await login(student.email); await page.goto(`/student/surveys/${campaignId}`);
    await page.locator(`textarea[name="q_${template.questions[0].id}"]`).fill("Nội dung đang viết");
    const failDraft = async (route: import("@playwright/test").Route) => route.request().method() === "POST" ? route.fulfill({ status: 500, body: "Unavailable" }) : route.continue();
    await page.route(`**/student/surveys/${campaignId}`, failDraft);
    await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click(); await expect(page.getByRole("status")).toContainText("Chưa lưu được bản nháp");
    await page.unroute(`**/student/surveys/${campaignId}`, failDraft);
    await home().click(); await popup.getByRole("button", { name: "Lưu nháp và rời trang", exact: true }).click(); await expect(page).toHaveURL(/\/student$/);
    const saved = await db.surveyParticipation.findUniqueOrThrow({ where: { campaignId_studentId: { campaignId, studentId: student.student!.id } } });
    expect(saved.status).toBe("DRAFT"); expect(JSON.stringify(saved.draft)).toContain("Nội dung đang viết");
    await page.goto(`/student/surveys/${campaignId}`); await page.locator(`textarea[name="q_${template.questions[0].id}"]`).fill("Nội dung chưa gửi");
    await page.locator(`input[name="q_${template.questions[1].id}"][value="4"]`).check();
    let unblock: () => void = () => {};
    const gate = new Promise<void>(resolve => { unblock = resolve; });
    const failSubmit = async (route: import("@playwright/test").Route) => { if (route.request().method() === "POST") { await gate; await route.fulfill({ status: 500, body: "Unavailable" }); } else await route.continue(); };
    await page.route(`**/student/surveys/${campaignId}`, failSubmit);
    await page.getByRole("button", { name: "Gửi phản hồi", exact: true }).click(); await expect(page.getByRole("button", { name: "Đang gửi…", exact: true })).toBeVisible();
    await home().click(); await expect(popup).toBeVisible(); await popup.getByRole("button", { name: "Tiếp tục chỉnh sửa", exact: true }).click();
    unblock(); await expect(page.getByRole("status")).toContainText("Chưa gửi được phản hồi"); await page.unroute(`**/student/surveys/${campaignId}`, failSubmit);
    await expect(page.locator(`textarea[name="q_${template.questions[0].id}"]`)).toHaveValue("Nội dung chưa gửi"); expect(await db.submission.count({ where: { campaignId } })).toBe(0);
    await db.surveyCampaign.update({ where: { id: campaignId }, data: { status: "CLOSED" } });
    await home().click(); await popup.getByRole("button", { name: "Lưu nháp và rời trang", exact: true }).click(); await expect(popup.getByRole("alert")).toBeVisible();
    await popup.getByRole("button", { name: "Tiếp tục chỉnh sửa", exact: true }).click(); await expect(page.locator(`textarea[name="q_${template.questions[0].id}"]`)).toHaveValue("Nội dung chưa gửi");
    await home().click(); await popup.getByRole("button", { name: "Bỏ thay đổi và rời trang", exact: true }).click(); await expect(page).toHaveURL(/\/student$/);

    for (const user of [teacher, dean]) {
      await login(user.email); await page.goto("/profile");
      await page.getByRole("textbox", { name: "Giới thiệu", exact: true }).fill(`${tag} hồ sơ mới`);
      await home().click(); await popup.getByRole("button", { name: "Lưu thay đổi và rời trang", exact: true }).click();
      await expect(page).toHaveURL(/\/(lecturer|dean)$/); expect((await db.user.findUniqueOrThrow({ where: { id: user.id } })).bio).toBe(`${tag} hồ sơ mới`);
      await page.goto("/profile"); await page.getByLabel("Mật khẩu hiện tại", { exact: true }).fill("sensitive-unsaved");
      await home().click(); await expect(popup).toBeVisible(); await expect(popup.getByRole("button", { name: /Lưu.*rời trang/ })).toHaveCount(0);
      await popup.getByRole("button", { name: "Bỏ thay đổi và rời trang", exact: true }).click(); await expect(page).toHaveURL(/\/(lecturer|dean)$/);
      expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain("sensitive-unsaved");
      await page.goto("/profile"); await page.getByRole("textbox", { name: "Giới thiệu", exact: true }).fill(`${tag} chưa lưu khi đăng xuất`);
      await page.getByRole("button", { name: "Đăng xuất", exact: true }).click(); await expect(popup).toBeVisible();
      await popup.getByRole("button", { name: "Bỏ thay đổi và rời trang", exact: true }).click(); await expect(page).toHaveURL(/\/login$/);
    }
    expect(errors).toEqual([]);
  } finally {
    await db.surveyCampaign.deleteMany({ where: { OR: [{ id: campaignId }, { title: { startsWith: tag } }] } }); await db.surveyTemplate.deleteMany({ where: { id: templateId } });
    await db.auditLog.deleteMany({ where: { actorId: { in: ids } } }); await db.user.deleteMany({ where: { id: { in: ids } } });
    await db.semester.deleteMany({ where: { id: semesterId } }); await db.faculty.deleteMany({ where: { id: facultyId } }); await db.$disconnect();
  }
});
