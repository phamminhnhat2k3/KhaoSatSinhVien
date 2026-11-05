import type { TemplateInput } from "../src/modules/templates/rules";
import { demoAccounts, demoFaculties } from "./demo-data";
import { educationSystems } from "../src/modules/academic/education";

export const completeDemoPassword = "vitrung65";
const extraNames = ["Minh Khang", "Bảo Ngọc", "Tuấn Kiệt", "Khánh Linh", "Hải Đăng"];
const familyNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Võ"];
export const completeSemesters = [
  { id: "demo-hk2-2526", name: "Học kỳ 2 · 2025–2026", startsAt: new Date("2026-01-19T00:00:00+07:00"), endsAt: new Date("2026-06-30T23:59:59+07:00") },
  { id: "demo-hk1-2627", name: "Học kỳ 1 · 2026–2027", startsAt: new Date("2026-08-24T00:00:00+07:00"), endsAt: new Date("2027-01-31T23:59:59+07:00") }
];
export const completeFaculties = demoFaculties.map(f => ({ id: `demo-khoa-${f.code.toLowerCase()}`, code: f.code, name: f.name }));
export const completeClasses = completeFaculties.flatMap(f => Object.entries(educationSystems).map(([educationSystem, system], index) => ({
  id: `demo-lop-${f.code.toLowerCase()}-${index + 1}`, facultyId: f.id, facultyCode: f.code, index,
  code: `${f.code}25-${["CQ", "VLVH", "TX"][index]}`, name: `${f.name} khóa 2025 · ${system.name}`, educationSystem
})));
export const completeTeachers = completeFaculties.flatMap(f => demoAccounts.filter(a => a.facultyCode === f.code && a.kind === "lecturer").map((a, index) => ({
  id: `demo-user-gv-${f.code.toLowerCase()}-${index + 1}`, profileId: `demo-gv-${f.code.toLowerCase()}-${index + 1}`, code: `GV-${f.code}-${index + 1}`,
  name: a.name, email: index === 0 ? `tk.${f.code.toLowerCase()}@demo.vn` : `gv.${f.code.toLowerCase()}${index + 1}@demo.vn`, facultyId: f.id, facultyCode: f.code, dean: index === 0, index
})));
export const completeStudents = completeFaculties.flatMap((f, fi) => Array.from({ length: 15 }, (_, index) => {
  const oldNames = demoAccounts.filter(a => a.facultyCode === f.code && a.kind === "student");
  return { id: `demo-user-sv-${f.code.toLowerCase()}-${index + 1}`, profileId: `demo-sv-${f.code.toLowerCase()}-${index + 1}`, code: `25${f.code}${String(index + 1).padStart(2, "0")}`,
    name: index < 10 ? oldNames[index].name : `${familyNames[fi]} ${extraNames[index - 10]}`, email: `sv.${f.code.toLowerCase()}${String(index + 1).padStart(2, "0")}@demo.vn`,
    facultyId: f.id, facultyCode: f.code, academicClassId: completeClasses.find(c => c.facultyId === f.id && c.index === Math.floor(index / 5))!.id, index };
}));
export const completeCourses = completeFaculties.flatMap((f, fi) => demoFaculties[fi].subjects.slice(0, 8).map((name, index) => ({
  id: `demo-mon-${f.code.toLowerCase()}-${index + 1}`, code: `${f.code}${101 + index}`, name, facultyId: f.id, semesterId: completeSemesters[Math.floor(index / 4)].id, index
})));
export const completeGroups = completeClasses.flatMap(home => completeCourses.filter(c => c.facultyId === home.facultyId).map(course => ({
  id: `demo-nhom-${home.facultyCode.toLowerCase()}-${home.index + 1}-${course.index + 1}`, code: `${course.code}-${home.index + 1}-${course.index < 4 ? "HK2" : "HK1"}`,
  courseId: course.id, semesterId: course.semesterId, educationSystem: home.educationSystem, capacity: 5, academicClassId: home.id,
  lecturerId: completeTeachers.find(t => t.facultyId === home.facultyId && t.index === (course.index % 4 + home.index + Math.floor(course.index / 4)) % 4)!.profileId
})));
export const completeExceptions = [
  { student: completeStudents.find(s => s.facultyCode === "CNTT" && s.index === 4)!, subjectIndex: 4 },
  { student: completeStudents.find(s => s.facultyCode === "CK" && s.index === 9)!, subjectIndex: 5 }
].map(({ student, subjectIndex }) => {
  const shared = completeGroups.filter(g => g.academicClassId === student.academicClassId && g.semesterId === completeSemesters[1].id);
  const original = shared.find(g => g.courseId === completeCourses.find(c => c.facultyId === student.facultyId && c.index === subjectIndex)!.id)!;
  const teacher = completeTeachers.filter(t => t.facultyId === student.facultyId).find(t => t.profileId !== original.lecturerId)!;
  const alternate = { ...original, id: `${original.id}-rieng`, code: `${original.code}-R`, lecturerId: teacher.profileId };
  return { studentId: student.profileId, semesterId: completeSemesters[1].id, originalId: original.id, alternate, classIds: shared.map(g => g.id === original.id ? alternate.id : g.id) };
});

const scale = (content: string, max = 5): TemplateInput["questions"][number] => ({ content, type: "SCALE", required: true, scaleMin: 1, scaleMax: max, scaleStep: 1, options: [] });
const text = (content: string): TemplateInput["questions"][number] => ({ ...scale(content), type: "TEXT", required: false });
const choice = (content: string, labels: string[], multiple = false): TemplateInput["questions"][number] => ({ ...scale(content), type: multiple ? "MULTIPLE" : "SINGLE", options: labels.map((label, i) => ({ label, value: String(i + 1) })) });
export const completeTemplates: (TemplateInput & { id: string })[] = [
  { id: "demo-mau-chung", title: "Trải nghiệm học tập trong học kỳ — thang 1 đến 5", questions: [
    scale("Kế hoạch học tập và lịch kiểm tra của học kỳ được thông báo rõ ràng, kịp thời."),
    scale("Khối lượng học tập giữa các môn trong học kỳ được phân bố hợp lý."),
    choice("Bạn thường gặp khó khăn nào nhất trong học kỳ này?", ["Sắp xếp thời gian học", "Kiến thức nền chưa vững", "Tiếp cận tài liệu học tập", "Thiết bị hoặc đường truyền", "Chưa gặp khó khăn đáng kể"]),
    choice("Những hỗ trợ nào sẽ giúp bạn học tập tốt hơn?", ["Lịch tư vấn học tập cố định", "Tài liệu và bài tập mẫu", "Hướng dẫn phương pháp tự học", "Hỗ trợ phần mềm và thiết bị", "Thêm thời gian thực hành"], true),
    text("Bạn có đề xuất gì để cải thiện việc tổ chức học tập trong học kỳ? Không ghi tên hoặc mã sinh viên.")
  ] },
  { id: "demo-mau-giang-day", title: "Đánh giá môn học và giảng viên thực dạy — thang 1 đến 5", questions: [
    scale("Giảng viên giới thiệu rõ mục tiêu, nội dung và yêu cầu của môn học."),
    scale("Giảng viên trình bày kiến thức dễ hiểu và sử dụng ví dụ phù hợp với nội dung môn học."),
    scale("Hoạt động học tập, bài tập và thực hành giúp bạn vận dụng kiến thức."),
    scale("Giảng viên khuyến khích trao đổi và giải đáp thắc mắc với thái độ tôn trọng."),
    scale("Tài liệu và hướng dẫn học tập được cung cấp đầy đủ, thuận tiện để truy cập."),
    scale("Tiêu chí đánh giá kết quả học tập được công bố rõ ràng và phản hồi bài làm có ích."),
    choice("Tốc độ triển khai nội dung môn học của giảng viên như thế nào?", ["Quá chậm", "Hơi chậm", "Phù hợp", "Hơi nhanh", "Quá nhanh"]),
    text("Điều gì trong cách tổ chức môn học hoặc giảng dạy nên được duy trì hay cải thiện? Không ghi thông tin nhận diện cá nhân.")
  ] },
  { id: "demo-mau-toan-truong", title: "Cơ sở vật chất và dịch vụ hỗ trợ sinh viên", questions: [
    scale("Phòng học, ánh sáng và thiết bị trình chiếu đáp ứng nhu cầu học tập."),
    scale("Phòng thực hành và thiết bị chuyên môn đáp ứng các hoạt động được tổ chức."),
    scale("Thư viện và học liệu điện tử thuận tiện cho việc tìm kiếm tài liệu."),
    scale("Kết nối mạng tại khu vực học tập đáp ứng nhu cầu truy cập học liệu."),
    scale("Khu vệ sinh và không gian sinh hoạt chung được duy trì sạch sẽ."),
    choice("Dịch vụ nào cần được ưu tiên cải thiện nhất?", ["Thủ tục hành chính sinh viên", "Tư vấn học tập", "Hỗ trợ kỹ thuật", "Thông tin học bổng và hỗ trợ tài chính", "Chưa có vấn đề đáng kể"]),
    choice("Bạn mong muốn nhà trường ưu tiên những nội dung nào?", ["Nâng cấp thiết bị học tập", "Tăng không gian tự học", "Cải thiện mạng Internet", "Rút ngắn thời gian xử lý thủ tục", "Mở rộng thời gian hỗ trợ sinh viên"], true),
    text("Mô tả một vấn đề cụ thể hoặc đề xuất cải thiện cơ sở vật chất, dịch vụ. Không ghi thông tin cá nhân.")
  ] },
  { id: "demo-mau-ho-tro-10", title: "Mẫu thử chỉnh sửa — tư vấn và hỗ trợ học tập, thang 10", questions: [
    scale("Mức độ dễ dàng khi tiếp cận kênh tư vấn học tập.", 10), scale("Mức độ hữu ích của nội dung tư vấn nhận được.", 10),
    choice("Kênh tư vấn bạn muốn sử dụng?", ["Gặp trực tiếp", "Email", "Cổng thông tin sinh viên", "Buổi tư vấn trực tuyến"]), text("Bạn muốn được hỗ trợ thêm về nội dung nào?")
  ] },
  { id: "demo-mau-thuc-hanh-100", title: "Mẫu thử xóa — mức độ đáp ứng học phần thực hành, thang 100", questions: [
    { ...scale("Mức độ đáp ứng của thiết bị thực hành.", 100), scaleMin: 0, scaleStep: 10 },
    { ...scale("Mức độ rõ ràng của hướng dẫn an toàn trước thực hành.", 100), scaleMin: 0, scaleStep: 10 }, text("Đề xuất cải thiện điều kiện thực hành.")
  ] }
];

export function demoAnswerValues(questions: { id: string; type: string; options: { value: string }[]; scaleMin: number; scaleMax: number; scaleStep: number; required: boolean }[], index: number) {
  const comments = ["Nên cung cấp tài liệu trước buổi học để sinh viên chuẩn bị.", "Mong có thêm bài tập gắn với tình huống thực tế.", "Phần hướng dẫn rõ ràng, nên dành thêm thời gian trao đổi.", "Cần thông báo sớm lịch kiểm tra và thời hạn nộp bài."];
  return Object.fromEntries(questions.map((q, i) => {
    const questionSeed = [...q.id].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 997, 0);
    const n = index * 7 + i * 3 + questionSeed;
    const steps = (q.scaleMax - q.scaleMin) / q.scaleStep;
    const value = q.type === "SCALE" ? String(q.scaleMin + Math.round(steps * [0.25, 0.5, 0.5, 0.75, 0.75, 0.75, 1, 1][n % 8]) * q.scaleStep)
      : q.type === "SINGLE" ? q.options[n % q.options.length].value
      : q.type === "MULTIPLE" ? [q.options[n % q.options.length].value, q.options[(n + 1) % q.options.length].value]
      : !q.required && n % 4 === 0 ? "" : `[Dữ liệu mô phỏng] ${comments[n % comments.length]}`;
    return [q.id, value];
  }));
}
