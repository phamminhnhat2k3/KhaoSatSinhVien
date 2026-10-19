import { PrismaClient, Role } from "@prisma/client";
import { hash } from "argon2";

const db = new PrismaClient();

async function main() {
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 8) throw new Error("Đặt SEED_PASSWORD tối thiểu 8 ký tự trước khi seed.");
  const passwordHash = await hash(password);
  await db.$transaction(async (tx) => {
    await tx.auditLog.deleteMany(); await tx.answer.deleteMany(); await tx.submission.deleteMany();
    await tx.surveyParticipation.deleteMany(); await tx.surveyTarget.deleteMany(); await tx.surveyCampaign.deleteMany();
    await tx.questionOption.deleteMany(); await tx.question.deleteMany(); await tx.surveyTemplate.deleteMany();
    await tx.enrollment.deleteMany(); await tx.courseClass.deleteMany(); await tx.course.deleteMany(); await tx.semester.deleteMany();
    await tx.studentProfile.deleteMany(); await tx.lecturerProfile.deleteMany(); await tx.userRole.deleteMany(); await tx.user.deleteMany();

    const admin = await tx.user.create({ data: { email: "admin@demo.vn", name: "Nguyễn Quản Trị", passwordHash, roles: { create: { role: Role.ADMIN } } } });
    const lecturerUser = await tx.user.create({ data: { email: "giangvien@demo.vn", name: "TS. Trần Minh Anh", passwordHash, roles: { create: { role: Role.LECTURER } }, lecturer: { create: { lecturerCode: "GV001" } } }, include: { lecturer: true } });
    const studentUsers = await Promise.all(Array.from({ length: 5 }, (_, index) => tx.user.create({ data: { email: `sinhvien${index + 1}@demo.vn`, name: `Sinh viên ${index + 1}`, passwordHash, roles: { create: { role: Role.STUDENT } }, student: { create: { studentCode: `SV00${index + 1}` } } }, include: { student: true } })));
    const semester = await tx.semester.create({ data: { name: "Học kỳ 1 · 2026–2027", startsAt: new Date("2026-08-01"), endsAt: new Date("2027-01-15") } });
    const course = await tx.course.create({ data: { code: "SE401", name: "Kiến trúc phần mềm" } });
    const courseClass = await tx.courseClass.create({ data: { code: "SE401.01", courseId: course.id, semesterId: semester.id, lecturerId: lecturerUser.lecturer!.id } });
    await tx.enrollment.createMany({ data: studentUsers.map((user) => ({ classId: courseClass.id, studentId: user.student!.id })) });
    const template = await tx.surveyTemplate.create({ data: { title: "Đánh giá chất lượng học phần", questions: { create: [
      { content: "Nội dung học phần được trình bày rõ ràng?", type: "SCALE", position: 1 },
      { content: "Hình thức học tập hiệu quả nhất?", type: "SINGLE", position: 2, options: { create: [{ label: "Bài giảng", value: "lecture", position: 1 }, { label: "Thực hành", value: "practice", position: 2 }, { label: "Thảo luận", value: "discussion", position: 3 }] } },
      { content: "Bạn đánh giá cao những điểm nào?", type: "MULTIPLE", position: 3, options: { create: [{ label: "Nội dung", value: "content", position: 1 }, { label: "Tài liệu", value: "material", position: 2 }, { label: "Tương tác", value: "interaction", position: 3 }] } },
      { content: "Đề xuất cải tiến cho học phần", type: "TEXT", position: 4, required: false }
    ] } }, include: { questions: true } });

    const open = await tx.surveyCampaign.create({ data: { title: "Khảo sát giữa kỳ", templateId: template.id, status: "PUBLISHED", startsAt: new Date("2026-01-01"), endsAt: new Date("2027-01-01"), publishedAt: new Date(), targets: { create: { classId: courseClass.id } } } });
    await tx.surveyParticipation.createMany({ data: studentUsers.map((user) => ({ campaignId: open.id, studentId: user.student!.id })) });
    const closed = await tx.surveyCampaign.create({ data: { title: "Khảo sát học phần đã hoàn tất", templateId: template.id, status: "CLOSED", startsAt: new Date("2026-01-01"), endsAt: new Date("2026-06-01"), publishedAt: new Date("2026-01-01"), targets: { create: { classId: courseClass.id } } } });
    await tx.surveyParticipation.createMany({ data: studentUsers.map((user) => ({ campaignId: closed.id, studentId: user.student!.id, status: "COMPLETED", completedAt: new Date("2026-05-20") })) });
    for (const [index] of studentUsers.entries()) await tx.submission.create({ data: { campaignId: closed.id, answers: { create: [
      { questionId: template.questions[0].id, value: String(index % 2 ? 4 : 5) },
      { questionId: template.questions[1].id, value: index % 2 ? "practice" : "discussion" },
      { questionId: template.questions[2].id, value: ["content", "interaction"] },
      { questionId: template.questions[3].id, value: `Phản hồi tổng hợp số ${index + 1}` }
    ] } } });
    await tx.auditLog.create({ data: { actorId: admin.id, action: "SEED", entity: "System", entityId: "initial" } });
  });
}

main().then(() => console.log("Đã tạo dữ liệu mẫu.")).finally(() => db.$disconnect());
