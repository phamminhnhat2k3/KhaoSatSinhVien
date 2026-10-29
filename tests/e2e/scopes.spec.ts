import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";
import { randomUUID } from "node:crypto";

test.describe("khảo sát khoa / toàn trường và danh sách sinh viên", () => {
  test.skip(!process.env.ISOLATED_FEATURE_DB, "Chỉ chạy qua test:e2e:isolated để không giao phiếu thử cho tài khoản thật.");
  test.setTimeout(180000);
  test.use({ actionTimeout: 15000 });
  const tag = `SCOPE-${randomUUID().slice(0, 6)}`.toUpperCase(), password = randomUUID();
  const db = new PrismaClient();
  let adminId: string, facultyId: string, otherFacultyId: string, semesterId: string, commonId: string, courseTemplateId: string, commonQuestion: string, subjectQuestion: string;
  const classes: string[] = [], students: { id: string; userId: string; email: string }[] = [];
  const courses: Record<string, { id: string; classId: string }> = {};
  test.beforeAll(async () => {
    expect(new URL(process.env.DATABASE_URL!).pathname).toBe(`/${process.env.ISOLATED_FEATURE_DB}`);
    const passwordHash = await hash(password);
    adminId = (await db.user.create({ data: { email: `${tag}-admin@example.invalid`, name: tag, passwordHash, roles: { create: { role: "ADMIN" } } } })).id;
    const teacher = await db.user.create({ data: { email: `${tag}-teacher@example.invalid`, name: "Giảng viên kiểm thử", passwordHash, roles: { create: { role: "LECTURER" } }, lecturer: { create: { lecturerCode: tag } } }, include: { lecturer: true } });
    facultyId = (await db.faculty.create({ data: { code: tag, name: `${tag} CNTT` } })).id;
    otherFacultyId = (await db.faculty.create({ data: { code: `${tag}-OTHER`, name: `${tag} Khoa khác` } })).id;
    for (const [i, f] of [facultyId, facultyId, otherFacultyId].entries()) classes.push((await db.academicClass.create({ data: { code: `${tag}-HC${i}`, name: `Lớp hành chính ${i}`, facultyId: f } })).id);
    semesterId = (await db.semester.create({ data: { name: `${tag} Học kỳ 1`, startsAt: new Date("2026-01-01"), endsAt: new Date("2027-01-01") } })).id;
    const previous = await db.semester.create({ data: { name: `${tag} Học kỳ cũ`, startsAt: new Date("2025-01-01"), endsAt: new Date("2025-12-31") } });
    for (const letter of ["A", "B", "C", "D", "E"]) {
      const c = await db.course.create({ data: { code: `${tag}-${letter}`, name: `Môn ${letter}`, facultyId } });
      courses[letter] = { id: c.id, classId: (await db.courseClass.create({ data: { code: `${tag}-${letter}.01`, courseId: c.id, semesterId, lecturerId: teacher.lecturer!.id } })).id };
    }
    for (let i = 0; i < 5; i++) {
      const email = `${tag}-sv${i}@example.invalid`;
      const u = await db.user.create({ data: { name: `${tag} Sinh viên ${i}`, email, passwordHash, active: i < 3, roles: { create: { role: "STUDENT" } }, student: { create: { studentCode: `${tag}-SV${i}`, academicClassId: classes[i === 2 ? 2 : i === 1 ? 1 : 0] } } }, include: { student: true } });
      students.push({ id: u.student!.id, userId: u.id, email });
    }
    for (const [i, letters] of [[0, ["A", "B", "C"]], [1, ["A", "D", "E"]], [2, ["A"]]] as const) await db.enrollment.createMany({ data: letters.map(l => ({ classId: courses[l].classId, studentId: students[i].id })) });
    const duplicateA = await db.courseClass.create({ data: { code: `${tag}-A.02`, courseId: courses.A.id, semesterId, lecturerId: teacher.lecturer!.id } });
    await db.enrollment.create({ data: { classId: duplicateA.id, studentId: students[0].id } });
    const oldC = await db.courseClass.create({ data: { code: `${tag}-C.OLD`, courseId: courses.C.id, semesterId: previous.id, lecturerId: teacher.lecturer!.id } });
    await db.enrollment.create({ data: { classId: oldC.id, studentId: students[1].id } });
    const common = await db.surveyTemplate.create({ data: { title: `${tag} Câu hỏi chung`, questions: { create: { content: "Chất lượng hoạt động chung", type: "SCALE", position: 1 } } }, include: { questions: true } });
    const subject = await db.surveyTemplate.create({ data: { title: `${tag} Đánh giá môn`, questions: { create: { content: "Chất lượng môn học", type: "SCALE", position: 1, scaleMin: 0, scaleMax: 100, scaleStep: 10 } } }, include: { questions: true } });
    commonId = common.id; commonQuestion = common.questions[0].id; courseTemplateId = subject.id; subjectQuestion = subject.questions[0].id;
  });
  test.afterAll(async () => { await db.$disconnect(); }); // The isolated runner removes this entire test-only database.
  async function login(page: Page, index: number | "admin") {
    await page.context().clearCookies(); await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(index === "admin" ? `${tag}-admin@example.invalid` : students[index].email);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page).toHaveURL(index === "admin" ? /\/admin$/ : /\/student$/);
  }
  async function createCampaign(page: Page, scope: "FACULTY" | "UNIVERSITY", title: string) {
    await page.goto("/admin/campaigns/new");
    await page.getByLabel("Tên đợt khảo sát").fill(title);
    await page.getByRole("combobox", { name: "Phạm vi khảo sát", exact: true }).selectOption(scope);
    await page.getByRole("combobox", { name: "Học kỳ khảo sát", exact: true }).selectOption(semesterId);
    if (scope === "FACULTY") {
      await page.getByRole("combobox", { name: "Khoa tổ chức", exact: true }).selectOption(facultyId);
      await page.getByRole("combobox", { name: "Mẫu đánh giá môn học", exact: true }).selectOption(courseTemplateId);
      for (const c of Object.values(courses)) await page.locator(`input[name="courseIds"][value="${c.id}"]`).check();
    }
    await page.getByRole("combobox", { name: "Mẫu câu hỏi chung", exact: true }).selectOption(commonId);
    await page.getByLabel("Bắt đầu", { exact: true }).fill("2026-01-01");
    await page.getByLabel("Kết thúc", { exact: true }).fill("2027-01-01");
    await page.getByRole("button", { name: "Tạo đợt khảo sát", exact: true }).click();
    await expect(page).toHaveURL(/created=1/);
    const campaign = await db.surveyCampaign.findFirstOrThrow({ where: { title } });
    expect(await db.surveyParticipation.count({ where: { campaignId: campaign.id } })).toBe(0);
    await page.goto(`/admin/campaigns/${campaign.id}/review`);
    return campaign;
  }
  test("phân phối đúng A/B/C và A/D/E, chốt khi công bố, toàn trường không lọc khoa, lọc sinh viên theo lớp hành chính", async ({ page }) => {
    await login(page, "admin");
    await page.goto(`/admin/students?q=${tag}`);
    await expect(page.getByRole("heading", { name: "5 người dùng phù hợp", exact: true })).toBeVisible();
    await page.getByRole("combobox", { name: "Lọc theo khoa", exact: true }).selectOption(facultyId);
    await page.getByRole("button", { name: "Lọc người dùng", exact: true }).click();
    await expect(page.getByRole("heading", { name: "4 người dùng phù hợp", exact: true })).toBeVisible();
    await page.getByRole("combobox", { name: "Lọc theo lớp hành chính", exact: true }).selectOption(classes[1]);
    await page.getByRole("button", { name: "Lọc người dùng", exact: true }).click();
    await expect(page.getByRole("heading", { name: "1 người dùng phù hợp", exact: true })).toBeVisible();
    await page.goto(`/admin/students?q=${tag}-SV0`);
    await expect(page.locator("main tbody tr")).toHaveCount(1);
    await page.locator(`a[href="/admin/students/${students[0].id}"]`).click();
    await expect(page.getByRole("heading", { name: "Đăng ký môn học", exact: true })).toBeVisible();
    const faculty = await createCampaign(page, "FACULTY", `${tag} Đợt khoa`);
    await expect(page.locator("main")).toContainText("Dự kiến 2 sinh viên");
    await db.user.update({ where: { id: students[3].userId }, data: { active: true } });
    await page.reload();
    await expect(page.locator("main")).toContainText("Dự kiến 3 sinh viên");
    await db.course.update({where:{id:courses.A.id},data:{facultyId:otherFacultyId}});
    await page.getByRole("button", { name: "Công bố", exact: true }).click();
    await expect(page.getByText(/Môn học đã thay đổi khoa/)).toBeVisible();
    expect((await db.surveyCampaign.findUniqueOrThrow({where:{id:faculty.id}})).status).toBe("DRAFT");
    expect(await db.surveyParticipation.count({where:{campaignId:faculty.id}})).toBe(0);
    await db.course.update({where:{id:courses.A.id},data:{facultyId}});
    await page.getByRole("button", { name: "Công bố", exact: true }).click();
    await expect(page).toHaveURL(/published=1/);
    const assignments = await db.surveyParticipation.findMany({ where: { campaignId: faculty.id }, include: { courses: true } });
    expect(assignments).toHaveLength(3);
    expect(assignments.find(p => p.studentId === students[0].id)!.courses.map(c => c.courseId).sort()).toEqual([courses.A.id, courses.B.id, courses.C.id].sort());
    expect(assignments.find(p => p.studentId === students[1].id)!.courses.map(c => c.courseId).sort()).toEqual([courses.A.id, courses.D.id, courses.E.id].sort());
    await page.goto(`/admin/students/${students[3].id}`);
    await page.getByRole("combobox", { name: "Lớp hành chính", exact: true }).selectOption(classes[2]);
    await page.getByRole("button", { name: "Lưu khoa/lớp", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Đã cập nhật khoa/lớp hành chính");
    await db.enrollment.create({ data: { studentId: students[3].id, classId: courses.A.classId } });
    for (const index of [0, 1, 3]) {
      await login(page, index);
      await page.goto(`/student/surveys/${faculty.id}`);
      const api = await page.request.get(`/api/surveys/${faculty.id}`);
      const body = await api.json();
      const expected = index === 0 ? ["A", "B", "C"] : index === 1 ? ["A", "D", "E"] : [];
      expect(body.questions.map((q: { id: string }) => q.id).sort()).toEqual([commonQuestion, ...expected.map(l => `${courses[l].id}:${subjectQuestion}`)].sort());
      if (index < 2) {
        const answers = { [commonQuestion]: "5", ...Object.fromEntries(expected.map(l => [`${courses[l].id}:${subjectQuestion}`, index === 0 ? "80" : "100"])) };
        const wrong = await page.request.post(`/api/surveys/${faculty.id}/submit`, { data: { ...answers, [`${courses[index === 0 ? "D" : "B"].id}:${subjectQuestion}`]: "10" } });
        expect(wrong.status()).toBe(400);
        expect((await page.request.post(`/api/surveys/${faculty.id}/submit`, { data: answers })).status()).toBe(201);
      }
    }
    await login(page, "admin");
    const row = page.locator("section.question").filter({ has: page.getByRole("heading", { name: faculty.title, exact: true }) });
    await row.getByRole("button", { name: "Đóng khảo sát", exact: true }).click();
    await expect(row.getByText("Đã đóng", { exact: true })).toBeVisible();
    const report = await (await page.request.get(`/api/reports/campaigns/${faculty.id}`)).json();
    expect(report.invited).toBe(3);
    expect(report.questions.map((q: { courseId: string | null }) => q.courseId)).toEqual([null, courses.A.id]);
    expect(report.questions[1]).toMatchObject({ average: 90, respondents: 2, invited: 2 });
    const university = await createCampaign(page, "UNIVERSITY", `${tag} Cơ sở vật chất toàn trường`);
    await expect(page.locator("main")).toContainText("Dự kiến 4 sinh viên");
    await page.getByRole("button", { name: "Công bố", exact: true }).click();
    await expect(page).toHaveURL(/published=1/);
    expect(await db.surveyParticipation.count({ where: { campaignId: university.id } })).toBe(4);
    expect(await db.participationCourse.count({ where: { participation: { campaignId: university.id } } })).toBe(0);
    await login(page, 2);
    expect((await page.request.get(`/api/surveys/${faculty.id}`)).status()).toBe(404);
    await page.goto(`/student/surveys/${university.id}`);
    await expect(page.getByRole("heading", { name: university.title, exact: true })).toBeVisible();
    await expect(page.getByText("Chất lượng môn học", { exact: false })).toHaveCount(0);
    await page.getByRole("radio", { name: "5", exact: true }).check();
    await page.getByRole("button", { name: "Gửi phản hồi", exact: true }).click();
    await expect(page).toHaveURL(/submitted=1/);
    await login(page, "admin");
    await page.goto(`/admin/students?q=${tag}`);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: ".playwright-cli/student-directory.png", fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    // Tables scroll inside their container rather than expanding the page.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(adminId).toBeTruthy();
  });
  test("tạo mẫu từ đợt ở tab mới, cập nhật lựa chọn và giữ toàn bộ nội dung đang nhập", async ({ page }) => {
    await login(page, "admin");
    await page.goto("/admin/campaigns/new");
    const title = `${tag} Đợt đang soạn`;
    await page.getByLabel("Tên đợt khảo sát").fill(title);
    await page.getByRole("combobox", { name: "Học kỳ khảo sát", exact: true }).selectOption(semesterId);
    await page.getByRole("combobox", { name: "Khoa tổ chức", exact: true }).selectOption(facultyId);
    await page.getByRole("combobox", { name: "Mẫu câu hỏi chung", exact: true }).selectOption(commonId);
    await page.getByRole("combobox", { name: "Mẫu đánh giá môn học", exact: true }).selectOption(courseTemplateId);
    await page.locator(`input[name="courseIds"][value="${courses.A.id}"]`).check();
    await page.getByLabel("Bắt đầu", { exact: true }).fill("2026-11-01");
    await page.getByLabel("Kết thúc", { exact: true }).fill("2026-12-15");
    const popupPromise = page.waitForEvent("popup");
    await page.getByRole("link", { name: "Tạo mẫu khảo sát mới ↗", exact: true }).click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(/\/admin\/templates\/new$/);
    const templateTitle = `${tag} Mẫu mới từ đợt`;
    await popup.getByLabel("Tên mẫu khảo sát", { exact: true }).fill(templateTitle);
    await popup.getByRole("button", { name: /Tự luận/ }).click();
    await popup.getByLabel("Nội dung câu 1", { exact: true }).fill("Góp ý của bạn?");
    await popup.getByRole("button", { name: "Lưu mẫu khảo sát", exact: true }).click();
    await expect(popup.getByRole("status")).toHaveText("Đã lưu mẫu khảo sát thành công.");
    await popup.close();
    await page.bringToFront();
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    const created = await db.surveyTemplate.findFirstOrThrow({ where: { title: templateTitle } });
    await expect(page.locator(`select[name="templateId"] option[value="${created.id}"]`)).toHaveCount(1);
    await expect(page.locator(`select[name="courseTemplateId"] option[value="${created.id}"]`)).toHaveCount(1);
    await expect(page.getByLabel("Tên đợt khảo sát")).toHaveValue(title);
    await expect(page.locator('select[name="semesterId"]')).toHaveValue(semesterId);
    await expect(page.locator('select[name="facultyId"]')).toHaveValue(facultyId);
    await expect(page.locator('select[name="templateId"]')).toHaveValue(commonId);
    await expect(page.locator('select[name="courseTemplateId"]')).toHaveValue(courseTemplateId);
    await expect(page.locator(`input[name="courseIds"][value="${courses.A.id}"]`)).toBeChecked();
    await expect(page.getByLabel("Bắt đầu", { exact: true })).toHaveValue("2026-11-01");
    await expect(page.getByLabel("Kết thúc", { exact: true })).toHaveValue("2026-12-15");
    await page.getByRole("button", { name: "Cập nhật danh sách mẫu", exact: true }).click();
    await page.getByRole("combobox", { name: "Mẫu câu hỏi chung", exact: true }).selectOption(created.id);
    await expect(page.getByLabel("Tên đợt khảo sát")).toHaveValue(title);
  });

});
