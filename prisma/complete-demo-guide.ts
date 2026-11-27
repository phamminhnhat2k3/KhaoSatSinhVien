import { completeClasses, completeCourses, completeExceptions, completeFaculties, completeGroups, completeSemesters, completeStudents, completeTeachers, completeDemoPassword } from "./complete-demo-data";
import { educationSystem } from "../src/modules/academic/education";

export function completeDemoGuide(_admins: { email: string; name: string }[], campaigns: { id: string; title: string; kind: string; facultyId: string | null }[]) {
  let text = `# Tài khoản và hướng dẫn bộ demo mới\n\nĐăng nhập: http://localhost:3005/login\n\nMật khẩu chung của tài khoản demo: **${completeDemoPassword}**. Tài khoản Admin dùng mật khẩu riêng và không có trong danh sách công khai. Database chỉ lưu mật khẩu băm.\n\nBộ dữ liệu: 2 học kỳ, 5 khoa, 15 lớp hành chính, 75 sinh viên, 20 giảng viên trong đó 5 Trưởng khoa, 40 môn, 122 lớp học phần (120 phân công chung và 2 nhóm học riêng). Mỗi lớp có 5 sinh viên và học 4 môn mỗi học kỳ.\n\n`;
  text += "## Các bước nên thử\n\n1. Admin: xem tổng quan, người dùng, 3 hệ học, phân công học kỳ và các mẫu. Hai mẫu có chữ ‘Mẫu thử’ chưa được sử dụng, phù hợp thử sửa/xóa.\n2. Mở đợt đã đóng của từng khoa hoặc toàn trường để xem kết quả, từng bài ẩn danh và xuất CSV. Phản hồi đã có đều là dữ liệu mô phỏng.\n3. Sinh viên đuôi 01, 06, 11: chưa làm khảo sát giữa học kỳ của khoa. Đuôi 02, 07, 12: có bản nháp. Đuôi 03, 08, 13: đã hoàn thành khảo sát khoa. Tất cả vẫn có thể xem lịch sử HK2.\n4. Giảng viên thường: xem phân công và kết quả thuộc môn/người dạy của mình. Trưởng khoa: xem kết quả trong khoa.\n5. Admin: sửa hoặc sao chép bản nháp của một khoa, kiểm tra học kỳ → khoa → lớp, xem trước rồi công bố nếu muốn. Đợt nháp mới chỉ chọn lớp Chính quy để dễ kiểm tra giới hạn người nhận.\n6. Thử đợt toàn trường đang mở. Đợt này chỉ có câu hỏi chung về cơ sở vật chất, không có phần môn học hoặc giảng viên.\n7. Thử bộ lọc Chờ bắt đầu và Đã hủy. Đợt chờ bắt đầu chỉ giao cho lớp Chính quy CNTT.\n8. Thử thông báo ở Admin, Sinh viên, Giảng viên, Trưởng khoa và hồ sơ/đổi ảnh đại diện bằng tài khoản mẫu.\n\n";
  for (const faculty of completeFaculties) {
    text += `## Khoa ${faculty.name} (${faculty.code})\n\n### Giảng viên và Trưởng khoa\n\n| Mã | Họ tên | Vai trò | Email đăng nhập | Mật khẩu |\n|---|---|---|---|---|\n`;
    const teachers = completeTeachers.filter(t => t.facultyId === faculty.id);
    for (const t of teachers) text += `| ${t.code} | ${t.name} | ${t.dean ? "Trưởng khoa + Giảng viên" : "Giảng viên"} | ${t.email} | ${completeDemoPassword} |\n`;
    for (const home of completeClasses.filter(c => c.facultyId === faculty.id)) {
      text += `\n### ${home.code} — ${educationSystem(home.educationSystem).name}\n\n${home.name}. 5 sinh viên, 4 môn mỗi học kỳ.\n\n| MSSV | Họ tên | Email đăng nhập | Mật khẩu |\n|---|---|---|---|\n`;
      for (const s of completeStudents.filter(s => s.academicClassId === home.id)) text += `| ${s.code} | ${s.name} | ${s.email} | ${completeDemoPassword} |\n`;
      text += "\n| Học kỳ | Mã môn | Môn học | Lớp học phần | Giảng viên thực dạy |\n|---|---|---|---|---|\n";
      for (const g of completeGroups.filter(g => g.academicClassId === home.id)) {
        const c = completeCourses.find(c => c.id === g.courseId)!, t = teachers.find(t => t.profileId === g.lecturerId)!;
        text += `| ${completeSemesters.find(s => s.id === g.semesterId)!.name} | ${c.code} | ${c.name} | ${g.code} | ${t.name} (${t.email}) |\n`;
      }
    }
    text += "\n### Đợt khảo sát của khoa\n\n| Tên đợt | Trạng thái mẫu | Trang quản trị |\n|---|---|---|\n";
    for (const c of campaigns.filter(c => c.facultyId === faculty.id)) text += `| ${c.title} | ${c.kind} | /admin/campaigns/${c.id}/${c.kind === "draft" ? "review" : "report"} |\n`;
    text += "\n";
  }
  text += "## Hai trường hợp học khác phân công\n\n| Sinh viên | Email | Học kỳ | Môn học | Giảng viên riêng | Lớp học phần riêng |\n|---|---|---|---|---|---|\n";
  for (const e of completeExceptions) {
    const s = completeStudents.find(s => s.profileId === e.studentId)!, c = completeCourses.find(c => c.id === e.alternate.courseId)!, t = completeTeachers.find(t => t.profileId === e.alternate.lecturerId)!;
    text += `| ${s.name} | ${s.email} | ${completeSemesters[1].name} | ${c.name} | ${t.name} | ${e.alternate.code} |\n`;
  }
  return text + "\nHai sinh viên này vẫn học 4 môn, chỉ đổi nhóm và giảng viên của một môn ở HK1. Dùng quản lý học vụ của sinh viên để thử khôi phục phân công chung.\n\nFile này công khai mật khẩu của tài khoản demo. Không dùng các mật khẩu này cho Admin hoặc tài khoản thật.\n";
}
