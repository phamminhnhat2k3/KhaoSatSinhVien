# Vai trò và phạm vi khoa

## Quản trị viên

Quản lý toàn hệ thống. Mở `/admin/lecturers` từ trang quản trị hoặc trang thêm sinh viên để tạo giảng viên, chỉnh hồ sơ nghiệp vụ, gắn khoa và phân công môn. Tích “Cấp quyền Trưởng khoa” để bổ nhiệm; bỏ tích để thu hồi. Giảng viên vẫn giữ vai trò LECTURER, quyền DEAN bổ sung quyền xem kết quả khoa. Khi đăng nhập, ADMIN ưu tiên vào trang quản trị; DEAN ưu tiên vào `/dean`; giảng viên thường vào `/lecturer`.

## Trưởng khoa

Chỉ xem kết quả khảo sát FACULTY thuộc khoa được gắn trong LecturerProfile. Trang `/dean` hiển thị các đợt đã công bố hoặc đã đóng; không hiển thị bản nháp, không xét duyệt, không thêm/sửa/xóa giảng viên. Báo cáo tổng hợp và CSV mở sau khi đóng hoặc hết hạn và đủ ngưỡng ẩn danh. Không truy cập được kết quả khoa khác hay báo cáo toàn trường.

Phòng công tác sinh viên, quản lý đào tạo và sau đại học sử dụng quyền quản trị để tổ chức khảo sát theo kế hoạch đã được phê duyệt trước khi tạo khảo sát. Không có bước duyệt lại của Trưởng khoa trong ứng dụng. Các trường xét duyệt cũ trong database được giữ để bảo toàn lịch sử nhưng không tham gia quy trình hiện tại.

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

## Đánh giá giảng viên thực dạy

Lớp mới vẫn có thể tạo trước khi phân công. Muốn công bố đợt đánh giá giảng viên, admin phải chọn người dạy thực tế ở từng lớp, hỗ trợ đồng giảng. Quyền xem kết quả chế độ này dựa vào danh sách đã chốt vào phiếu, không lấy phân công môn hiện tại. Xem [hướng dẫn](DANH_GIA_GIANG_VIEN_THUC_DAY.md).
