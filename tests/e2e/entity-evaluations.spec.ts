import { expect, test } from "@playwright/test";
import { PrismaClient, type Prisma, type Course } from "@prisma/client";
import { hash } from "argon2";
import { randomUUID } from "node:crypto";

test("tab đánh giá trong popup đúng đối tượng và giữ lịch sử sinh viên ẩn danh", async ({ page }) => {
  test.skip(!process.env.ISOLATED_FEATURE_DB, "Chỉ chạy trong database nghiệm thu riêng.");
  test.setTimeout(120000);
  const db = new PrismaClient(), tag = `EV-${randomUUID().slice(0, 6)}`, password = randomUUID();
  try {
    expect(new URL(process.env.DATABASE_URL!).pathname).toBe(`/${process.env.ISOLATED_FEATURE_DB}`);
    const passwordHash = await hash(password);
    const faculty = await db.faculty.create({ data: { code: tag, name: `${tag} Khoa` } });
    const home = await db.academicClass.create({ data: { code: tag, name: tag, facultyId: faculty.id } });
    const admin = await db.user.create({ data: { name: `${tag} Admin`, email: `${tag}-admin@example.invalid`, passwordHash, roles: { create: { role: "ADMIN" } } } });
    const dean = await db.user.create({ data: { name: `${tag} Dean`, email: `${tag}-dean@example.invalid`, passwordHash, roles: { create: [{ role: "LECTURER" }, { role: "DEAN" }] }, lecturer: { create: { lecturerCode: `${tag}-dean`, facultyId: faculty.id } } } });
    const otherFaculty = await db.faculty.create({ data: { code: `${tag}-outside`, name: `${tag} Outside` } });
    const outsider = await db.user.create({ data: { name: `${tag} Outside`, email: `${tag}-outside@example.invalid`, passwordHash, roles: { create: { role: "LECTURER" } }, lecturer: { create: { lecturerCode: `${tag}-outside`, facultyId: otherFaculty.id } } } });
    const teachers: Prisma.UserGetPayload<{ include: { lecturer: true } }>[] = [];
    for (let i = 0; i < 2; i++) teachers.push(await db.user.create({ data: { name: `${tag} GV ${i}`, email: `${tag}-gv${i}@example.invalid`, passwordHash, roles: { create: { role: "LECTURER" } }, lecturer: { create: { lecturerCode: `${tag}-gv${i}`, facultyId: faculty.id } } }, include: { lecturer: true } }));
    const students = [];
    for (let i = 0; i < 2; i++) students.push(await db.user.create({ data: { name: `${tag} SV ${i}`, email: `${tag}-sv${i}@example.invalid`, passwordHash, roles: { create: { role: "STUDENT" } }, student: { create: { studentCode: `${tag}-sv${i}`, academicClassId: home.id } } }, include: { student: true } }));
    const courses: Course[] = [];
    for (let i = 0; i < 2; i++) courses.push(await db.course.create({ data: { code: `${tag}-${i}`, name: `${tag} Môn ${i}`, facultyId: faculty.id } }));
    const common = await db.surveyTemplate.create({ data: { title: `${tag} Chung` } });
    const specific = await db.surveyTemplate.create({ data: { title: `${tag} Môn`, questions: { create: [{ content: `${tag} Điểm giảng dạy`, type: "SCALE", position: 1 }, { content: `${tag} Góp ý`, type: "TEXT", position: 2 }] } }, include: { questions: { orderBy: { position: "asc" } } } });
    const campaign = await db.surveyCampaign.create({ data: { title: `${tag} Đã kết thúc`, scope: "FACULTY", facultyId: faculty.id, evaluationMode: "LECTURER", status: "CLOSED", startsAt: new Date(Date.now() - 864000000), endsAt: new Date(Date.now() - 86400000), templateId: common.id, courseTemplateId: specific.id, courseTargets: { create: courses.map(c => ({ courseId: c.id })) } } });
    for (const student of students) {
      await db.surveyParticipation.create({ data: { studentId: student.student!.id, campaignId: campaign.id, status: "COMPLETED", completedAt: new Date(), teachings: { create: courses.map((c, i) => ({ courseId: c.id, lecturerId: teachers[i].lecturer!.id })) } } });
      await db.submission.create({ data: { campaignId: campaign.id, answers: { create: courses.flatMap((c, i) => [{ courseId: c.id, lecturerId: teachers[i].lecturer!.id, questionId: specific.questions[0].id, value: String(i + 3) }, { courseId: c.id, lecturerId: teachers[i].lecturer!.id, questionId: specific.questions[1].id, value: `${tag} Nhận xét riêng ${i}` }]) } } });
    }
    const open = await db.surveyCampaign.create({ data: { title: `${tag} Đang mở`, scope: "FACULTY", facultyId: faculty.id, evaluationMode: "LECTURER", status: "PUBLISHED", startsAt: new Date(Date.now() - 86400000), endsAt: new Date(Date.now() + 86400000), templateId: common.id, courseTemplateId: specific.id, courseTargets: { create: { courseId: courses[0].id } }, participations: { create: { studentId: students[0].student!.id, teachings: { create: { courseId: courses[0].id, lecturerId: teachers[0].lecturer!.id } } } } } });
    expect((await page.request.get(`/api/admin/details/evaluations?type=user&id=${students[0].id}`)).status()).toBe(403);
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(admin.email);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page.waitForURL("**/admin");
    await page.goto(`/admin/users?q=${encodeURIComponent(students[0].name)}`);
    await page.getByRole("button", { name: students[0].name, exact: true }).click();
    let dialog = page.getByRole("dialog");
    await dialog.getByRole("tab", { name: "Đánh giá", exact: true }).click();
    await expect(dialog.getByText("1 phiếu đã gửi", { exact: true })).toBeVisible();
    await expect(dialog.getByRole("heading", { name: campaign.title, exact: true })).toBeVisible();
    await expect(dialog.getByRole("heading", { name: open.title, exact: true })).toHaveCount(0);
    await expect(dialog.getByText(/Nội dung bài trả lời được lưu ẩn danh/)).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Xem kết quả", exact: true })).toHaveCount(0);
    await expect(page).toHaveURL(/\/admin\/users\?/);
    await dialog.getByRole("tab", { name: "Đánh giá", exact: true }).press("ArrowLeft");
    await expect(dialog.getByRole("tab", { name: "Thông tin", exact: true })).toHaveAttribute("aria-selected", "true");
    await dialog.getByRole("button", { name: "Đóng thông tin" }).click();
    await page.goto(`/admin/lecturers?q=${encodeURIComponent(teachers[0].name)}`);
    await page.getByRole("button", { name: teachers[0].name, exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByRole("tab", { name: "Đánh giá", exact: true }).click();
    await dialog.locator("li").filter({ has: page.getByRole("heading", { name: open.title, exact: true }) }).getByRole("button", { name: "Xem kết quả" }).click();
    await expect(dialog.getByRole("alert")).toContainText("đóng hoặc hết hạn");
    await dialog.getByRole("button", { name: "← Danh sách đánh giá" }).click();
    await dialog.locator("li").filter({ has: page.getByRole("heading", { name: campaign.title, exact: true }) }).getByRole("button", { name: "Xem kết quả" }).click();
    await expect(dialog.getByText(`${tag} Nhận xét riêng 0`, { exact: true })).toHaveCount(2);
    await expect(dialog.getByText(`${tag} Nhận xét riêng 1`, { exact: true })).toHaveCount(0);
    await expect(dialog.getByRole("link", { name: "Xuất CSV" })).toHaveCount(0);
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await dialog.evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);
    }
    const courseData = await (await page.request.get(`/api/admin/details/evaluations?type=course&id=${courses[0].id}&campaignId=${campaign.id}`)).json();
    expect(courseData.report.questions.every((q: { courseId: string }) => q.courseId === courses[0].id)).toBe(true);
    const facultyData = await (await page.request.get(`/api/admin/details/evaluations?type=faculty&id=${faculty.id}`)).json();
    expect(facultyData.total).toBe(2);
    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(dean.email);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page.waitForURL("**/dean");
    await page.getByRole("link", { name: "Giảng viên và sinh viên", exact: true }).click();
    await expect(page).toHaveURL(/\/dean\/people$/);
    await expect(page.getByRole("button", { name: outsider.name, exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: teachers[0].name, exact: true }).click();
    dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("button", { name: /Khóa|Mở khóa/ })).toHaveCount(0);
    await dialog.getByRole("tab", { name: "Đánh giá", exact: true }).click();
    await dialog.locator("li").filter({ has: page.getByRole("heading", { name: campaign.title, exact: true }) }).getByRole("button", { name: "Xem kết quả" }).click();
    await expect(dialog.getByText(`${tag} Nhận xét riêng 0`, { exact: true })).toHaveCount(2);
    await dialog.getByRole("button", { name: "Đóng thông tin" }).click();
    await page.getByRole("button", { name: students[0].name, exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByRole("tab", { name: "Đánh giá", exact: true }).click();
    await expect(dialog.getByText("1 phiếu đã gửi trong khoa", { exact: true })).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Quản lý học vụ" })).toHaveCount(0);
    expect((await page.request.get(`/api/admin/details?type=user&id=${outsider.id}`)).status()).toBe(403);
    expect((await page.request.get(`/api/admin/details/evaluations?type=user&id=${outsider.id}`)).ok()).toBe(false);
    expect(errors).toEqual([]);
  } finally {
    try {
      await db.surveyCampaign.deleteMany({ where: { title: { startsWith: tag } } });
      await db.surveyTemplate.deleteMany({ where: { title: { startsWith: tag } } });
      await db.user.deleteMany({ where: { email: { startsWith: `${tag}-` } } });
      await db.course.deleteMany({ where: { code: { startsWith: `${tag}-` } } });
      await db.academicClass.deleteMany({ where: { code: tag } });
      await db.faculty.deleteMany({ where: { code: { startsWith: tag } } });
    } finally { await db.$disconnect(); }
  }
});
