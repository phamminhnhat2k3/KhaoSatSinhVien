import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { hash, verify } from "argon2";
import { PrismaClient } from "@prisma/client";
import { backupAndVerify } from "./demo-backup";
import { resetCompleteDemo } from "./complete-demo-service";
import { completeDemoGuide } from "./complete-demo-guide";
import { completeDemoPassword, completeStudents, completeTeachers } from "./complete-demo-data";
import { getAudience } from "../src/modules/survey-campaign/audience";
import { getCampaignReport } from "../src/modules/reporting/service";

const db = new PrismaClient();
async function main() {
  const admins = await db.user.findMany({ where: { roles: { some: { role: "ADMIN" } } }, select: { id: true, name: true, email: true, active: true }, orderBy: { id: "asc" } });
  assert(admins.some(a => a.active), "Phải có ít nhất một Admin đang hoạt động.");
  if (!process.argv.includes("--apply")) {
    console.log("Chỉ xem kế hoạch, chưa sửa dữ liệu. Thêm --apply để sao lưu, khôi phục thử rồi thay toàn bộ dữ liệu nghiệp vụ, giữ tài khoản Admin.");
    console.log(JSON.stringify({ database: new URL(process.env.DATABASE_URL!).pathname.slice(1), admins: admins.map(a => a.email), semesters: 2, faculties: 5, academicClasses: 15, students: 75, lecturers: 20, deans: 5, courses: 40, courseClasses: 122, templates: 5, campaigns: 20 }));
    return;
  }
  console.log("Đang sao lưu và khôi phục thử trên database tạm. Chưa xóa dữ liệu gốc.");
  const backup = await backupAndVerify(db);
  console.log(`Bản sao lưu đã khôi phục thử và đối chiếu số dòng: ${backup.directory}`);
  const hashes = new Map<string, string>();
  for (const account of [...admins, ...completeTeachers, ...completeStudents]) hashes.set(account.id, await hash(completeDemoPassword));
  console.log("Đang tạo bộ dữ liệu mới trong một giao dịch. Nếu lỗi, toàn bộ giao dịch sẽ được hoàn tác.");
  const result = await resetCompleteDemo(db, hashes);
  assert.deepEqual(await db.user.findMany({ where: { id: { in: admins.map(a => a.id) } }, select: { id: true, name: true, email: true, active: true }, orderBy: { id: "asc" } }), admins);
  const users = await db.user.findMany({ select: { id: true, email: true, passwordHash: true } });
  for (const user of users) assert(await verify(user.passwordHash, completeDemoPassword), `Mật khẩu không khớp: ${user.email}`);
  for (const campaign of await db.surveyCampaign.findMany({ where: { scope: "FACULTY", status: "PUBLISHED" }, include: { courseTargets: true, academicTargets: true } })) {
    const audience = await getAudience(db, campaign);
    assert(audience.every(s => new Set(s.enrollments.map(e => e.class.courseId)).size === 4), "Mỗi sinh viên phải học đúng 4 môn.");
  }
  for (const campaign of result.campaigns.filter(c => c.kind === "closed")) {
    const report = await getCampaignReport(db, campaign.id);
    assert(report.questions.length > 0, "Báo cáo mẫu phải có kết quả đủ ngưỡng.");
  }
  const guide = completeDemoGuide(result.admins, result.campaigns);
  writeFileSync("TAI_KHOAN_MAU.md", guide, "utf8");
  writeFileSync(join(backup.directory, "TAI_KHOAN_MAU_MOI.md"), guide, "utf8");
  writeFileSync(join(backup.directory, "new-demo.json"), JSON.stringify({ createdAt: new Date().toISOString(), admins: result.admins, campaigns: result.campaigns }, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({ verified: true, keptAdmins: admins.length, totalUsers: users.length, faculties: await db.faculty.count(), academicClasses: await db.academicClass.count(), semesters: await db.semester.count(), courses: await db.course.count(), courseClasses: await db.courseClass.count(), surveys: await db.surveyCampaign.count(), submissions: await db.submission.count(), guide: "TAI_KHOAN_MAU.md", backup: backup.directory }));
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Không tạo được bộ demo."); process.exitCode = 1; }).finally(() => db.$disconnect());
