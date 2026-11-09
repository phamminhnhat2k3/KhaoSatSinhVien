import type { Role } from "@prisma/client";

export const roleGuides: { role: Role; title: string; steps: { title: string; href: string; instructions: string[] }[] }[] = [
  { role: "ADMIN", title: "Quản trị viên", steps: [
    { title: "1. Chuẩn bị học vụ và tài khoản", href: "/admin/academic", instructions: ["Tạo khoa, học kỳ và lớp hành chính. Chọn đúng hệ học cho lớp.", "Trong Tất cả người dùng, tạo sinh viên, giảng viên và gán đúng khoa, lớp. Quyền trưởng khoa được cấp cho giảng viên thuộc khoa đó.", "Sửa tên, mã trong Sửa nhanh. Chỉ xóa danh mục không còn dữ liệu liên quan, hệ thống sẽ báo lý do nếu không thể xóa."] },
    { title: "2. Phân công môn học", href: "/admin/assignments", instructions: ["Tạo lớp học phần theo môn, học kỳ, khoa và hệ học. Phân công một giảng viên thực dạy cho mỗi lớp học phần.", "Chọn học kỳ → khoa → lớp hành chính, rồi chọn một lớp học phần cho mỗi môn. Sinh viên trong lớp dùng phân công chung.", "Chỉ thiết lập môn riêng cho sinh viên học khác phân công chung. Kiểm tra lại trước khi công bố khảo sát."] },
    { title: "3. Soạn mẫu và công bố khảo sát", href: "/admin/templates", instructions: ["Thêm câu hỏi bằng kéo thả hoặc bấm loại câu hỏi. Thiết lập thang điểm, lựa chọn và câu bắt buộc, rồi xem trước và lưu mẫu.", "Tạo đợt khảo sát, chọn học kỳ → khoa → lớp hành chính. Khảo sát toàn trường dùng nội dung chung. Khảo sát giảng dạy có phần theo từng môn và giảng viên thực dạy.", "Xem lại người nhận và thời gian trước khi công bố. Phiếu đã giao giữ phân công tại thời điểm công bố, sửa phân công sau đó không đổi phiếu cũ."] },
    { title: "4. Theo dõi và tổng hợp", href: "/admin", instructions: ["Mở Tiến độ / Tổng hợp kết quả của đợt để theo dõi số phiếu và tỷ lệ hoàn thành.", "Kết quả chỉ mở khi đợt đã đóng hoặc hết hạn và đủ ngưỡng phản hồi. Lọc từng phần để xem điểm, lựa chọn và góp ý, hoặc xuất CSV.", "Danh sách sinh viên chỉ cho biết trạng thái hoàn thành. Câu trả lời được lưu ẩn danh, không ghép nội dung phiếu với tên sinh viên."] },
  ] },
  { role: "STUDENT", title: "Sinh viên", steps: [
    { title: "Làm và gửi khảo sát", href: "/student", instructions: ["Trong Khảo sát của tôi, chọn đợt đang mở và kiểm tra học kỳ, môn, giảng viên cần đánh giá.", "Trả lời lần lượt nội dung chung và từng phần môn học. Có thể lưu nháp để tiếp tục trước hạn.", "Kiểm tra các câu bắt buộc rồi gửi phiếu. Mỗi đợt chỉ gửi một lần và không sửa sau khi gửi.", "Phiếu được lưu ẩn danh. Không ghi tên, mã sinh viên hay thông tin nhận diện vào góp ý. Nếu sai môn hoặc giảng viên, báo đơn vị quản lý trước khi gửi."] },
  ] },
  { role: "LECTURER", title: "Giảng viên", steps: [
    { title: "Xem phản hồi giảng dạy", href: "/lecturer", instructions: ["Lọc học kỳ hoặc đợt khảo sát trong Kết quả giảng dạy, chọn đợt muốn xem.", "Bạn chỉ xem kết quả trong phạm vi giảng dạy được phân công. Mỗi phần ghi rõ môn và giảng viên được đánh giá.", "Khi đợt đã đóng hoặc hết hạn và đủ ngưỡng, chọn từng phần để xem thống kê và góp ý ẩn danh. Có thể xuất CSV trong phạm vi được phép."] },
  ] },
  { role: "DEAN", title: "Trưởng khoa", steps: [
    { title: "Theo dõi kết quả trong khoa", href: "/dean", instructions: ["Chọn học kỳ và đợt trong Kết quả khảo sát của khoa. Chỉ các đợt thuộc khoa được phân công mới hiển thị.", "Xem thống kê theo môn, giảng viên và góp ý khi đủ điều kiện mở kết quả. Xuất CSV nếu cần tổng hợp.", "Trưởng khoa xem kết quả, không duyệt hay công bố đợt khảo sát. Việc tổ chức do quản trị viên phụ trách."] },
    { title: "Tra cứu giảng viên và sinh viên", href: "/dean/people", instructions: ["Mở Tra cứu trong khoa, dùng bộ lọc để tìm người cần xem.", "Bấm tên để xem thông tin. Tab Đánh giá hiển thị kết quả giảng viên hoặc lịch sử hoàn thành của sinh viên trong phạm vi khoa.", "Lịch sử sinh viên không hiển thị nội dung phiếu gắn với danh tính."] },
  ] },
];
