import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";
import { randomUUID } from "node:crypto";

test.describe("phân công chung theo lớp và ngoại lệ sinh viên", () => {
  test.skip(!process.env.ISOLATED_FEATURE_DB, "Chỉ chạy trong database nghiệm thu riêng.");
  test.setTimeout(180000);
  const db = new PrismaClient(), tag = `PLAN-${randomUUID().slice(0, 6)}`, password = randomUUID();
  let wrongSystemId:string,semesterId: string, facultyId: string, otherFacultyId: string, homeId: string, otherHomeId: string, commonId: string, specificId: string;
  const teachers: string[] = [], groups: string[] = [], courseIds: string[] = [], students: { id: string; email: string }[] = [];
  test.beforeAll(async () => {
    expect(new URL(process.env.DATABASE_URL!).pathname).toBe(`/${process.env.ISOLATED_FEATURE_DB}`);
    const passwordHash = await hash(password);
    await db.user.create({ data: { name: tag, email: `${tag}-admin@example.invalid`, passwordHash, roles: { create: { role: "ADMIN" } } } });
    facultyId = (await db.faculty.create({ data: { code: tag, name: `${tag} CNTT` } })).id;
    otherFacultyId = (await db.faculty.create({ data: { code: `${tag}-other`, name: `${tag} Cơ khí` } })).id;
    homeId = (await db.academicClass.create({ data: { code: `${tag}-A`, name: "Lớp A", facultyId } })).id;
    otherHomeId = (await db.academicClass.create({ data: { code: `${tag}-B`, name: "Lớp B", facultyId } })).id;
    semesterId = (await db.semester.create({ data: { name: `${tag} Học kỳ 1`, startsAt: new Date("2026-01-01"), endsAt: new Date("2027-12-31") } })).id;
    for (let i = 0; i < 2; i++) {
      const teacher = await db.user.create({ data: { name: `${tag} Giảng viên ${i}`, email: `${tag}-gv${i}@example.invalid`, passwordHash, roles: { create: { role: "LECTURER" } }, lecturer: { create: { lecturerCode: `${tag}-GV${i}`, facultyId } } }, include: { lecturer: true } });
      teachers.push(teacher.lecturer!.id);
      const course = await db.course.create({ data: { code: `${tag}-M${i}`, name: `${tag} Môn ${i}`, facultyId } });
      courseIds.push(course.id);
      groups.push((await db.courseClass.create({ data: { code: `${tag}-G${i}`, courseId: course.id, semesterId, teachingConfigured: true, teachings: { create: { lecturerId: teachers[0] } } } })).id);
    }
    groups.push((await db.courseClass.create({ data: { code: `${tag}-G-ALT`, courseId: courseIds[0], semesterId, teachingConfigured: true, teachings: { create: { lecturerId: teachers[1] } } } })).id);
    wrongSystemId=(await db.courseClass.create({data:{code:`${tag}-DISTANCE`,courseId:courseIds[0],semesterId,educationSystem:"DISTANCE",teachingConfigured:true,teachings:{create:{lecturerId:teachers[1]}}}})).id;
    for (let i = 0; i < 3; i++) {
      const student = await db.user.create({ data: { name: `${tag} Sinh viên ${i}`, email: `${tag}-sv${i}@example.invalid`, passwordHash, roles: { create: { role: "STUDENT" } }, student: { create: { studentCode: `${tag}-SV${i}`, academicClassId: i === 2 ? otherHomeId : homeId } } }, include: { student: true } });
      students.push({ id: student.student!.id, email: student.email });
    }
    commonId = (await db.surveyTemplate.create({ data: { title: `${tag} Chung`, questions: { create: { content: "Đánh giá chung học kỳ", type: "SCALE", position: 1 } } } })).id;
    specificId = (await db.surveyTemplate.create({ data: { title: `${tag} Môn và giảng viên`, questions: { create: { content: "Giảng viên giải thích nội dung môn rõ ràng", type: "SCALE", position: 1 } } } })).id;
  });
  test.afterAll(async () => { await db.user.updateMany({where:{name:{startsWith:tag}},data:{active:false}}); await db.$disconnect(); });
  async function login(page: Page, email: string) {
    await page.context().clearCookies(); await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email); await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(page).not.toHaveURL(/\/login$/);
  }
  test("phân công cho lớp, đổi người dạy riêng, nhận đúng phiếu và giữ snapshot", async ({ page }) => {
    await login(page, `${tag}-admin@example.invalid`);
    await page.goto("/admin/assignments");
    await expect(page.getByRole("combobox", {name:"Khoa của lớp", exact:true})).toBeDisabled();
    await page.getByRole("combobox", {name:"Học kỳ phân công", exact:true}).selectOption(semesterId);
    await page.getByRole("combobox", {name:"Khoa của lớp", exact:true}).selectOption(facultyId);
    await page.getByRole("combobox", {name:"Lớp hành chính được phân công", exact:true}).selectOption(homeId);
    const firstCourse=page.locator(`select[data-course-id="${courseIds[0]}"]`);
    await expect(page.locator('select[data-course-id]')).toHaveCount(2);
    await expect(firstCourse).not.toHaveAttribute("multiple");
    await expect(firstCourse.locator(`option[value="${wrongSystemId}"]`)).toHaveCount(0);
    await firstCourse.selectOption(groups[0]);
    await firstCourse.selectOption(groups[2]);
    await expect(firstCourse).toHaveValue(groups[2]);
    await expect(firstCourse.locator('option:checked')).toHaveCount(1);
    await firstCourse.selectOption(groups[0]);
    await page.locator(`select[data-course-id="${courseIds[1]}"]`).selectOption(groups[1]);
    await page.setViewportSize({width:390,height:844});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.setViewportSize({width:1440,height:1000});
    await page.screenshot({path:".playwright-cli/assignment-single-teacher.png",fullPage:true});
    await page.getByRole("button", { name: "Lưu phân công cho lớp", exact: true }).click();
    await expect(page.locator("main").getByRole("status")).toContainText("Đã lưu phân công chung");
    expect(await db.enrollment.count({ where: { studentId: { in: students.map(s => s.id) } } })).toBe(0);
    await page.goto(`/admin/students/${students[1].id}`);
    const adjustment = page.locator("section").filter({ has: page.getByRole("heading", { name: "Điều chỉnh môn học riêng", exact: true }) });
    await adjustment.getByRole("combobox", {name:"Học kỳ điều chỉnh riêng", exact:true}).selectOption(semesterId);
    for (const [i,id] of groups.slice(0,2).entries()) {
      await expect(adjustment.locator(`select[data-course-id="${courseIds[i]}"]`)).toHaveValue(id);
      await adjustment.locator(`select[data-course-id="${courseIds[i]}"]`).selectOption("");
    }
    await adjustment.locator(`select[data-course-id="${courseIds[0]}"]`).selectOption(groups[2]);
    await adjustment.getByRole("button", { name: "Lưu môn học riêng", exact: true }).click();
    await expect(adjustment.getByRole("status")).toContainText("Đã lưu môn học riêng");
    // A newly added student inherits the plan without copying enrollments.
    const newcomer = await db.user.create({ data: { name: `${tag} Sinh viên mới`, email: `${tag}-new@example.invalid`, passwordHash: await hash(password), roles: { create: { role: "STUDENT" } }, student: { create: { studentCode: `${tag}-NEW`, academicClassId: homeId } } }, include: { student: true } });
    await page.goto("/admin/campaigns/new");
    await expect(page.getByRole("combobox", {name:"Khoa tổ chức", exact:true})).toBeDisabled();
    await page.getByRole("combobox", {name:"Học kỳ khảo sát", exact:true}).selectOption(semesterId);
    await page.getByRole("combobox", {name:"Khoa tổ chức", exact:true}).selectOption(facultyId);
    await page.locator(`input[name="academicClassIds"][value="${homeId}"]`).check();
    await page.getByRole("combobox", {name:"Khoa tổ chức", exact:true}).selectOption(otherFacultyId);
    await expect(page.locator(`input[name="academicClassIds"][value="${homeId}"]`)).toHaveCount(0);
    await page.getByRole("combobox", {name:"Khoa tổ chức", exact:true}).selectOption(facultyId);
    await expect(page.locator(`input[name="academicClassIds"][value="${homeId}"]`)).not.toBeChecked();
    await page.locator(`input[name="academicClassIds"][value="${homeId}"]`).check();
    await page.getByLabel("Tên đợt khảo sát").fill(`${tag} Đánh giá cuối kỳ`);
    await page.getByRole("combobox", {name:"Mẫu câu hỏi chung", exact:true}).selectOption(commonId);
    await page.getByRole("combobox", {name:"Mẫu đánh giá môn học", exact:true}).selectOption(specificId);
    await expect(page.getByRole("combobox", {name:"Đối tượng đánh giá", exact:true})).toHaveValue("LECTURER");
    for (const id of courseIds) await page.locator(`input[name="courseIds"][value="${id}"]`).check();
    await page.getByLabel("Bắt đầu", { exact: true }).fill("2026-01-01"); await page.getByLabel("Kết thúc", { exact: true }).fill("2027-12-31");
    await page.getByRole("button", { name: "Tạo đợt khảo sát", exact: true }).click(); await expect(page).toHaveURL(/created=1/);
    const campaign = await db.surveyCampaign.findFirstOrThrow({ where: { title: `${tag} Đánh giá cuối kỳ` } });
    await page.goto(`/admin/campaigns/${campaign.id}/review`);
    await expect(page.locator("main")).toContainText("Dự kiến 3 sinh viên");
    await expect(page.locator("tbody tr").filter({ hasText: `${tag}-SV1` })).toContainText(`${tag} Giảng viên 1`);
    await page.setViewportSize({ width: 1440, height: 1000 }); await page.screenshot({ path: ".playwright-cli/class-plan-preview.png", fullPage: true });
    await page.getByRole("button", { name: "Công bố", exact: true }).click(); await expect(page).toHaveURL(/published=1/);
    const snapshot = await db.surveyParticipation.findMany({ where: { campaignId: campaign.id }, include: { teachings: true } });
    expect(snapshot).toHaveLength(3);
    expect(snapshot.find(p => p.studentId === students[0].id)!.teachings.map(t => [t.courseId, t.lecturerId]).sort()).toEqual(courseIds.map(id => [id, teachers[0]]).sort());
    expect(snapshot.find(p => p.studentId === students[1].id)!.teachings.map(t => [t.courseId, t.lecturerId])).toEqual([[courseIds[0], teachers[1]]]);
    expect(snapshot.find(p => p.studentId === newcomer.student!.id)!.teachings).toHaveLength(2);
    await db.classStudyAssignment.deleteMany({ where: { academicClassId: homeId } });
    await db.courseTeaching.update({ where: { classId_lecturerId: { classId: groups[0], lecturerId: teachers[0] } }, data: { lecturerId: teachers[1] } });
    await login(page, students[0].email);
    const response = await page.request.get(`/api/surveys/${campaign.id}`); expect(response.status()).toBe(200);
    const body = await response.json();
    expect([...new Set(body.questions.map((q: { lecturerId?: string }) => q.lecturerId).filter(Boolean))]).toEqual([teachers[0]]);
    expect((await page.request.post(`/api/surveys/${campaign.id}/submit`, { data: Object.fromEntries(body.questions.map((q: { id: string }) => [q.id, "5"])) })).status()).toBe(201);
    await login(page, students[2].email); expect((await page.request.get(`/api/surveys/${campaign.id}`)).status()).toBe(404);
    await page.goto("/admin/assignments"); await expect(page.getByRole("button", { name: "Lưu phân công cho lớp", exact: true })).toHaveCount(0);
  });
});
