# Vai trò và phạm vi khoa

## Quản trị viên

Quản lý toàn hệ thống. Mở `/admin/lecturers` từ trang quản trị hoặc trang thêm sinh viên để tạo giảng viên, chỉnh hồ sơ nghiệp vụ, gắn khoa và phân công môn. Tích “Cấp quyền Trưởng khoa” để bổ nhiệm; bỏ tích để thu hồi. Giảng viên vẫn giữ vai trò LECTURER, quyền DEAN bổ sung quyền quản lý khoa. Khi đăng nhập, ADMIN ưu tiên vào trang quản trị; DEAN ưu tiên vào `/dean`; giảng viên thường vào `/lecturer`.

## Trưởng khoa

Chỉ quản lý khoa được gắn trong LecturerProfile. Trang `/dean` hiển thị các đợt khảo sát FACULTY thuộc khoa đó, thời gian, môn, mẫu chung và ý kiến xét duyệt. Có thể duyệt hoặc yêu cầu chỉnh sửa đợt nháp. Quyết định có người duyệt, thời điểm và nhật ký; quản trị viên nhận thông báo. Quản trị viên vẫn có quyền công bố trực tiếp, được ghi nhật ký công bố.

Trưởng khoa xem thống kê môn của đợt thuộc khoa, xuất CSV theo cùng phạm vi, sau khi đóng và đủ ngưỡng ẩn danh. Không được truy cập đợt khoa khác hay báo cáo toàn trường. Có thể thêm, cập nhật giảng viên thường trong khoa; không được bổ nhiệm Trưởng khoa hay thay đổi hồ sơ Trưởng khoa.

## Giảng viên và sinh viên

Giảng viên thuộc một khoa và được phân công các môn của khoa trong hồ sơ nghiệp vụ. Các lớp mới không cần giảng viên phụ trách. Quyền xem báo cáo giảng viên lấy từ môn được phân công; phân công lớp cũ được giữ để các khảo sát cũ tiếp tục hoạt động.

Sinh viên thuộc khoa thông qua lớp hành chính. Đăng ký lớp học phần xác định các môn thực học và được đánh giá. Hồ sơ giới thiệu cá nhân không thay đổi khoa nghiệp vụ.

## Lớp và môn học

Môn thuộc một khoa. Tạo lớp cần mã/tên môn, mã lớp, học kỳ, khoa, hệ đào tạo (Chính quy, Vừa học vừa làm, Đào tạo từ xa) và sĩ số dự kiến. Bảng lớp hiển thị số đã ghi danh cùng sĩ số. Sĩ số là thông tin kế hoạch, chưa tự chặn ghi danh khi vượt số này. Khoa của lớp lấy từ môn để tránh hai thông tin khoa mâu thuẫn.

## Dữ liệu cũ

Migration bổ sung, không xóa dữ liệu. Các giảng viên và môn cũ chưa có khoa vẫn giữ nguyên, không suy đoán khoa từ trường giới thiệu tự nhập. Admin vào danh sách giảng viên để gắn khoa; với môn cũ, nhập đúng mã/tên môn khi tạo lớp và chọn khoa để phân khoa. Sinh viên cũ được phân khoa bằng lớp hành chính như trước. Chỉ hồ sơ được phân khoa mới có thể dùng quyền Trưởng khoa.

Các thông tin mới bắt buộc chọn khoa khi tạo qua giao diện. Cột khoa nullable chỉ để giữ tương thích dữ liệu lịch sử. Ngưỡng ẩn danh của báo cáo được giữ nguyên; admin xem từng phiếu đã gửi qua trang bài đánh giá hiện có.

## Nghiệm thu

`npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:isolated`. Nghiệm thu trình duyệt dùng database tạm riêng và dọn sau khi chạy; không tạo tài khoản thử trong database đang sử dụng.
