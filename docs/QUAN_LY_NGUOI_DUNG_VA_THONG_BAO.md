# Quản lý người dùng và thông báo nhanh

## Danh sách người dùng

Quản trị viên mở `/admin/users` từ thanh bên hoặc trang điều hành. Danh sách gồm quản trị viên, Trưởng khoa, giảng viên và sinh viên; tìm theo họ tên, email hoặc mã nghiệp vụ. Có thể kết hợp bộ lọc vai trò, khoa, lớp hành chính và trạng thái tài khoản. Lọc lớp hành chính chỉ áp dụng cho sinh viên. Đường dẫn danh sách sinh viên cũ chuyển về danh sách chung với vai trò Sinh viên được chọn sẵn.

Mỗi dòng hiển thị mã, email, số điện thoại, vai trò, trạng thái, khoa và lớp. Sinh viên có liên kết xem ghi danh, khảo sát và chỉnh hồ sơ học vụ. Giảng viên hiển thị các môn được phân công.

Nhấn **Sửa nhanh** để mở biểu mẫu ngay trên danh sách. Sinh viên có thể cập nhật tên, email, điện thoại, mã sinh viên và lớp hành chính; khoa được xác định theo lớp. Giảng viên có thể cập nhật tên, email, điện thoại, mã, khoa, môn giảng dạy và quyền Trưởng khoa. Chỉ quản trị viên được cấp hoặc thu hồi quyền Trưởng khoa. Các tài khoản quản trị có biểu mẫu thông tin cơ bản, không tự cấp hoặc thay đổi vai trò tại đây.

## Khóa và xóa

Khóa/mở khóa yêu cầu xác nhận; khóa sẽ ngăn đăng nhập và các truy cập cần xác thực, giữ nguyên hồ sơ và lịch sử. Không thể tự khóa hoặc xóa tài khoản đang đăng nhập.

Xóa chỉ áp dụng tài khoản không phải quản trị viên, chưa có lịch sử tham gia khảo sát, nhật ký do chính tài khoản thực hiện hoặc lớp cũ đang phụ trách. Khi xóa, đăng ký học hiện tại và thông báo riêng được xóa cùng tài khoản; không xóa phiếu khảo sát đã phát sinh. Nếu bị chặn vì lịch sử, sử dụng khóa tài khoản. Thao tác quản trị được ghi nhật ký.

## Quản lý khoa

Trang `/admin/academic` giữ biểu mẫu thêm khoa, bổ sung số lớp hành chính, giảng viên, môn và đợt khảo sát của mỗi khoa. **Sửa nhanh** cho phép cập nhật mã/tên; nút xóa cần xác nhận. Khoa còn lớp, giảng viên, môn hoặc đợt khảo sát sẽ bị chặn xóa, tránh tự chuyển hồ sơ thành chưa phân khoa.

## Thông báo

Bấm chuông trên header hoặc mục Thông báo ở thanh bên để mở bảng trượt từ bên phải, không chuyển khỏi trang đang thao tác. Bảng có danh sách, lọc chưa đọc, phân trang, đánh dấu từng mục/tất cả và xem chi tiết. Bấm X hoặc Escape để đóng; bàn phím được giữ trong bảng khi mở.

Khi trang đang hoạt động, danh sách được kiểm tra mỗi 15 giây; khi quay lại cửa sổ cũng kiểm tra lại. Có thông báo mới sẽ hiện ô nhắc nhỏ trong 6 giây và cập nhật số chưa đọc. Thông báo đã có khi mở trang không tạo ô nhắc giả. Xem chi tiết đánh dấu đã đọc trước khi mở đúng nội dung liên quan. Đường dẫn `/notifications` cũ mở bảng nhanh từ hồ sơ, không còn trang danh sách riêng.

API luôn giới hạn theo tài khoản đăng nhập và kiểm tra trạng thái hoạt động; không thể đánh dấu đọc thông báo của tài khoản khác. Không thay đổi schema database cho các thao tác này.
