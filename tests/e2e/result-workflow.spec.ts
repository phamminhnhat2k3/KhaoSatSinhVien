import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";
import { randomUUID } from "node:crypto";
import { saveResultNote } from "../../src/modules/reporting/notes";
import ExcelJS from "exceljs";
import { PDFDocument } from "pdf-lib";
import { writeFile } from "node:fs/promises";
import { runAutomaticReminders } from "../../src/modules/notifications/automatic";
test.use({ actionTimeout: 15000 });

test("nhập CSV, nhắc đúng người, đối chiếu giảng viên và gửi nhận xét theo quyền", async ({ page }) => {
  test.skip(!process.env.ISOLATED_FEATURE_DB, "Chỉ chạy trên database nghiệm thu riêng.");
  test.setTimeout(180000);
  expect(new URL(process.env.DATABASE_URL!).pathname).toBe(`/${process.env.ISOLATED_FEATURE_DB}`);
  const db = new PrismaClient(), tag = `RESULT-${randomUUID().slice(0, 6)}`, password = randomUUID();
  const errors: string[] = []; page.on("pageerror", e => errors.push(`${page.url()}: ${e.message}`));
  page.on("dialog", d => void d.accept());
  async function login(email: string) {
    await page.context().clearCookies(); await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email); await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await page.waitForURL(/\/(admin|student|lecturer|dean)$/);
  }
  async function upload(raw: string) { await page.getByLabel("Tệp CSV UTF-8 hoặc Excel XLSX", { exact: true }).setInputFiles({ name: "data.csv", mimeType: "text/csv", buffer: Buffer.from("\uFEFF"+raw) }); await page.getByRole("button", { name: "Kiểm tra và xem trước", exact: true }).click(); }
  async function applyImport() { await page.locator('input[name="confirm"]').check(); await page.getByRole("button", { name: "Xác nhận nhập dữ liệu", exact: true }).click(); await expect(page.getByRole("status").filter({ hasText: "Đã nhập thành công" }).first()).toBeVisible(); }
  try {
    const passwordHash = await hash(password);
    const faculty = await db.faculty.create({ data: { code: tag, name: tag } });
    const outside = await db.faculty.create({ data: { code: `${tag}-OUT`, name: `${tag} ngoài khoa` } });
    const home = await db.academicClass.create({ data: { code: tag, name: tag, facultyId: faculty.id } });
    const term = await db.semester.create({ data: { name: tag, startsAt: new Date("2026-01-01"), endsAt: new Date("2027-01-01") } });
    const previousTerm = await db.semester.create({ data: { name: `${tag} kỳ trước`, startsAt: new Date("2025-01-01"), endsAt: new Date("2026-01-01") } });
    const admin = await db.user.create({ data: { name: `${tag} Admin`, email: `${tag}-admin@example.invalid`, passwordHash, roles: { create: { role: "ADMIN" } } } });
    const dean = await db.user.create({ data: { name: `${tag} Dean`, email: `${tag}-dean@example.invalid`, passwordHash, roles: { create: [{ role: "LECTURER" }, { role: "DEAN" }] }, lecturer: { create: { lecturerCode: `${tag}-DEAN`, facultyId: faculty.id } } } });
    const foreignDean = await db.user.create({ data: { name: `${tag} Foreign`, email: `${tag}-foreign@example.invalid`, passwordHash, roles: { create: [{ role: "LECTURER" }, { role: "DEAN" }] }, lecturer: { create: { lecturerCode: `${tag}-OUT`, facultyId: outside.id } } } });
    const teachers = [];
    for (let i=0;i<3;i++) teachers.push(await db.user.create({ data: { name: `${tag} GV ${i}`, email: `${tag}-gv${i}@example.invalid`, passwordHash, roles: { create: { role: "LECTURER" } }, lecturer: { create: { lecturerCode: `${tag}-GV${i}`, facultyId: faculty.id } } }, include: { lecturer: true } }));
    const students = [];
    for (let i=0;i<4;i++) students.push(await db.user.create({ data: { active: i!==3, name: `${tag} SV ${i}`, email: `${tag}-sv${i}@example.invalid`, passwordHash, roles: { create: { role: "STUDENT" } }, student: { create: { studentCode: `${tag}-SV${i}`, academicClassId: home.id } } }, include: { student: true } }));
    const course = await db.course.create({ data: { code: tag, name: `${tag} Môn`, facultyId: faculty.id } });
    const cls = await db.courseClass.create({ data: { code: `${tag}-HP1`, courseId: course.id, semesterId: term.id, teachingConfigured: true, teachings: { create: { lecturerId: teachers[0].lecturer!.id } } } });
    const cls2 = await db.courseClass.create({ data: { code: `${tag}-HP2`, courseId: course.id, semesterId: term.id, teachingConfigured: true, teachings: { create: { lecturerId: teachers[1].lecturer!.id } } } });
    const common = await db.surveyTemplate.create({ data: { title: `${tag} chung` } });
    const specific = await db.surveyTemplate.create({ data: { title: `${tag} riêng`, questions: { create: { content: "Giảng viên phản hồi bài tập rõ ràng", type: "SCALE", position: 1, scaleMin: 1, scaleMax: 5 } } }, include: { questions: true } });
    const closed = await db.surveyCampaign.create({ data: { title: `${tag} đã đóng`, facultyId: faculty.id, semesterId: term.id, scope: "FACULTY", evaluationMode: "LECTURER", templateId: common.id, courseTemplateId: specific.id, status: "CLOSED", startsAt: new Date(Date.now()-864000000), endsAt: new Date(Date.now()-86400000), courseTargets: { create: { courseId: course.id } } } });
    const old = await db.surveyCampaign.create({ data: { title: `${tag} kỳ trước`, facultyId: faculty.id, semesterId: previousTerm.id, scope: "FACULTY", evaluationMode: "LECTURER", templateId: common.id, courseTemplateId: specific.id, status: "CLOSED", startsAt: new Date(Date.now()-864000000), endsAt: new Date(Date.now()-86400000), courseTargets: { create: { courseId: course.id } } } });
    for (const c of [closed, old]) for (let i=0;i<2;i++) {
      await db.surveyParticipation.create({ data: { campaignId: c.id, studentId: students[i].student!.id, status: "COMPLETED", teachings: { create: teachers.map(t => ({ lecturerId: t.lecturer!.id, courseId: course.id })) } } });
      await db.submission.create({ data: { campaignId: c.id, answers: { create: teachers.filter((_,n) => n<2 || i===0).map((t,n) => ({ questionId: specific.questions[0].id, lecturerId: t.lecturer!.id, courseId: course.id, value: String(c.id===old.id ? 3 : n===0 ? 2 : n===1 ? 5 : 1) })) } } });
    }
    const open = await db.surveyCampaign.create({ data: { title: `${tag} mở`, facultyId: faculty.id, scope: "FACULTY", templateId: common.id, status: "PUBLISHED", startsAt: new Date(Date.now()-86400000), endsAt: new Date(Date.now()+86400000), participations: { create: students.map((s,i) => ({ studentId: s.student!.id, status: i===0 ? "COMPLETED" : "INVITED" })) } } });

    await login(admin.email); await page.goto("/admin/import");
    await upload(`name,email,studentCode,academicClassCode\n${tag} imported,${tag.toLowerCase()}-import@example.invalid,${tag}-NEW,${tag}\n${tag} lỗi,x@example.invalid,${tag}-BAD,KHONGCO`);
    await expect(page.getByRole("status").filter({ hasText: "Có dòng chưa hợp lệ" }).first()).toBeVisible();
    expect(await db.user.count({ where: { name: `${tag} imported` } })).toBe(0);
    await upload(`name,email,studentCode,academicClassCode\n${tag} imported,${tag.toLowerCase()}-import@example.invalid,${tag}-NEW,${tag}`);
    await page.getByLabel("Mật khẩu khởi tạo chung").fill(password); await applyImport();
    expect(await db.studentProfile.count({ where: { studentCode: `${tag}-NEW`, academicClassId: home.id } })).toBe(1);
    await page.getByRole("combobox", { name: "Loại dữ liệu", exact: true }).selectOption("lecturers");
    const templateResponse=await page.request.get("/api/admin/import-template?kind=lecturers");expect(templateResponse.status()).toBe(200);
    const teacherBook=new ExcelJS.Workbook();const teacherSheet=teacherBook.addWorksheet("Dữ liệu");teacherSheet.addRows([["name","email","lecturerCode","facultyCode","dean"],[`${tag} imported GV`,`${tag.toLowerCase()}-importgv@example.invalid`,`${tag}-NEWGV`,tag,"yes"]]);
    await page.getByLabel("Tệp CSV UTF-8 hoặc Excel XLSX",{exact:true}).setInputFiles({name:"giangvien.xlsx",mimeType:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",buffer:Buffer.from(await teacherBook.xlsx.writeBuffer())});
    await page.getByRole("button",{name:"Kiểm tra và xem trước",exact:true}).click();
    await page.getByLabel("Mật khẩu khởi tạo chung").fill(password); await applyImport();
    const imported = await db.user.findUniqueOrThrow({ where: { email: `${tag.toLowerCase()}-importgv@example.invalid` }, include: { roles: true } }); expect(imported.roles.map(r => r.role)).toContain("DEAN");
    await page.getByRole("combobox", { name: "Loại dữ liệu", exact: true }).selectOption("assignments");
    await upload(`semesterName,academicClassCode,courseClassCode\n${tag},${tag},${cls.code}\n${tag},${tag},${cls2.code}`);
    await expect(page.getByRole("cell", { name: /Mỗi môn chỉ chọn/ }).first()).toBeVisible();
    expect(await db.classStudyAssignment.count({ where: { academicClassId: home.id } })).toBe(0);
    await upload(`semesterName,academicClassCode,courseClassCode\n${tag},${tag},${cls.code}`); await applyImport();
    expect(await db.classStudyAssignment.count({ where: { academicClassId: home.id, classId: cls.id } })).toBe(1);
    await page.goto(`/admin/campaigns/${open.id}/report`); await page.getByRole("button", { name: "Gửi lời nhắc trong web", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Đã gửi lời nhắc" }).first()).toBeVisible();
    const notifications = await db.notification.findMany({ where: { title: "Nhắc hoàn thành khảo sát", userId: { in: students.map(s => s.id) } } });
    expect(notifications.map(n => n.userId).sort()).toEqual([students[1].id, students[2].id].sort());
    await page.getByRole("button", { name: "Gửi lời nhắc trong web", exact: true }).click(); await expect(page.getByRole("status").filter({ hasText: "24 giờ" }).first()).toBeVisible();
    await db.surveyCampaign.update({where:{id:open.id},data:{endsAt:new Date(Date.now()+3*86400000)}});
    const later=new Date(Date.now()+25*3600000);await runAutomaticReminders(db,later);await runAutomaticReminders(db,later);
    const auto=await db.notification.findMany({where:{title:"Nhắc hạn khảo sát tự động",userId:{in:students.map(s=>s.id)}}});
    expect(auto.map(n=>n.userId).sort()).toEqual([students[1].id,students[2].id].sort());

    await login(dean.email); await page.goto(`/results?campaign=${closed.id}&course=${course.id}&reference=${old.id}`);
    await expect(page.getByRole("table", { name: "Kết quả theo từng tiêu chí", exact: true })).toContainText("3.5");
    await expect(page.getByRole("table", { name: "Kết quả theo từng tiêu chí", exact: true })).toContainText("Chưa đủ ngưỡng");
    await expect(page.getByRole("table", { name: "Thay đổi qua học kỳ", exact: true })).toContainText("-1");
    await page.getByRole("table", { name: "Kết quả theo từng tiêu chí", exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: ".tmp/results-desktop.png" });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: ".tmp/results-mobile.png" });
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.getByLabel("Tiêu đề", { exact: true }).fill(`${tag} nhận xét khoa`);
    await page.getByLabel("Nhận xét dựa trên kết quả").fill("Cần cải thiện việc phản hồi bài tập, chưa kết luận từ điểm trung bình.");
    await page.getByLabel("Hướng cải thiện và thời gian dự kiến").fill("Trao đổi với giảng viên và theo dõi lại trong học kỳ tiếp theo.");
    await page.getByRole("button", { name: "Lưu bản nháp nhận xét", exact: true }).click(); await page.waitForURL(/\/results\/notes\//);
    const noteId = page.url().split("/").pop()!;
    expect(await db.notification.count({ where: { userId: admin.id, href: `/results/notes/${noteId}` } })).toBe(0);
    await page.getByRole("button", { name: "Gửi báo cáo", exact: true }).click();
    await expect(page.getByRole("button", { name: "Gửi báo cáo", exact: true })).toHaveCount(0);
    expect((await db.resultNote.findUniqueOrThrow({ where: { id: noteId } })).status).toBe("SENT");
    await expect(saveResultNote(db, { id: dean.id, roles: ["DEAN"], facultyId: faculty.id }, { id: noteId, campaignId: closed.id, courseId: course.id, lecturerIds: [teachers[0].lecturer!.id], title: "Cố sửa bản đã gửi", observation: "Nội dung đã gửi không được sửa", plan: "Kế hoạch đã gửi không được sửa", send: true })).rejects.toThrow("Bản đã gửi");
    expect(await db.notification.count({ where: { userId: admin.id, href: `/results/notes/${noteId}` } })).toBe(1);
    await login(foreignDean.email); await page.goto(`/results?campaign=${closed.id}&course=${course.id}`); await expect(page.getByRole("status")).toContainText("trong khoa");
    expect((await page.goto(`/results/notes/${noteId}`))?.status()).toBe(404);
    await login(teachers[0].email); await page.goto(`/results?campaign=${closed.id}&course=${course.id}`);
    await expect(page.getByRole("table", { name: "Kết quả theo từng tiêu chí", exact: true })).not.toContainText(teachers[1].name);
    await expect(saveResultNote(db, { id: teachers[0].id, roles: ["LECTURER"], lecturerId: teachers[0].lecturer!.id, facultyId: faculty.id }, { campaignId: closed.id, courseId: course.id, lecturerIds: [teachers[1].lecturer!.id], title: "Cố xem điểm người khác", observation: "Không được truy cập giảng viên khác", plan: "Không được gửi thay giảng viên khác", send: true })).rejects.toThrow("phạm vi");
    await page.getByLabel("Tiêu đề", { exact: true }).fill(`${tag} cải thiện`); await page.getByLabel("Nhận xét dựa trên kết quả").fill("Tôi cần điều chỉnh thời gian trả bài và phản hồi."); await page.getByLabel("Hướng cải thiện và thời gian dự kiến").fill("Trả nhận xét bài tập trong vòng bảy ngày ở học kỳ tiếp theo."); await page.getByRole("button", { name: "Gửi báo cáo", exact: true }).click(); await page.waitForURL(/\/results\/notes\//);
    await login(admin.email); await page.goto(`/results/notes/${noteId}`); await expect(page.getByRole("button", { name: "In / Lưu PDF để gửi nhà trường" })).toBeVisible();
    const pdfResponse=await page.request.get(`/api/reports/notes/${noteId}/export?format=pdf`);expect(pdfResponse.status()).toBe(200);expect(pdfResponse.headers()["content-type"]).toBe("application/pdf");
    await writeFile(".tmp/report-standard-review.pdf",await pdfResponse.body());
    const pdf=await PDFDocument.load(await pdfResponse.body());expect(pdf.getPageCount()).toBeGreaterThan(0);
    const xlsxResponse=await page.request.get(`/api/reports/campaigns/${closed.id}/export?format=xlsx`);expect(xlsxResponse.status()).toBe(200);
    const resultBook=new ExcelJS.Workbook();const resultBytes=await xlsxResponse.body();await resultBook.xlsx.load(resultBytes.buffer.slice(resultBytes.byteOffset,resultBytes.byteOffset+resultBytes.byteLength) as ArrayBuffer);expect(resultBook.getWorksheet("Kết quả")!.rowCount).toBeGreaterThan(1);
    await page.getByRole("link",{name:"Tải PDF báo cáo",exact:true}).click();
    await page.emulateMedia({ media: "print" }); await expect(page.locator("header.nav")).toBeHidden(); await page.emulateMedia({ media: "screen" });
    await login(students[0].email); await page.goto("/admin/import"); await expect(page).toHaveURL(/\/unauthorized$/);
    expect((await page.request.get(`/api/reports/notes/${noteId}/export?format=pdf`)).status()).toBe(403);
    expect((await page.request.get(`/api/reports/campaigns/${closed.id}/export?format=pdf`)).ok()).toBe(false);
    expect(errors).toEqual([]);
  } finally {
    try {
      await db.surveyCampaign.deleteMany({ where: { title: { startsWith: tag } } });
      await db.surveyTemplate.deleteMany({ where: { title: { startsWith: tag } } });
      await db.classStudyAssignment.deleteMany({ where: { academicClass: { code: tag } } });
      await db.courseClass.deleteMany({ where: { code: { startsWith: tag } } });
      await db.auditLog.deleteMany({ where: { actor: { name: { startsWith: tag } } } });
      await db.user.deleteMany({ where: { name: { startsWith: tag } } });
      await db.course.deleteMany({ where: { code: tag } });
      await db.academicClass.deleteMany({ where: { code: tag } });
      await db.faculty.deleteMany({ where: { code: { startsWith: tag } } });
      await db.semester.deleteMany({ where: { name: { startsWith: tag } } });
    } finally { await db.$disconnect(); }
  }
});
