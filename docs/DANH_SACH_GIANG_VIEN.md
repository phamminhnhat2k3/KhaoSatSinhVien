# Danh sách giảng viên và Trưởng khoa — 01/11/2026

- Bảng chia cột họ tên/mã/email, khoa, vai trò/trạng thái, môn phụ trách và thao tác. Không mở toàn bộ form giữa danh sách.
- Tìm họ tên, email hoặc mã; kết hợp khoa, vai trò và trạng thái. “Giảng viên thường” loại trừ tài khoản có quyền Trưởng khoa.
- Phân trang 20 người, giữ bộ lọc khi đổi trang; áp dụng lọc sẽ trở về trang đầu. Có số kết quả và hướng dẫn khi không tìm thấy.
- Form thêm giảng viên được thu gọn; nút Thêm giảng viên mở form. Các đường thêm từ trang người dùng/sinh viên dẫn thẳng đến form đang mở.
- Bấm tên người, khoa hoặc môn để xem thông tin ở popup hiện có. Chỉ hiển thị trước 2 môn, có nút mở thêm nếu còn môn.
- Sửa nhanh mở hộp thoại với các trường nghiệp vụ, cấp/thu quyền Trưởng khoa và thao tác tài khoản hiện có. Thông tin cá nhân vẫn chỉ đọc; người dùng tự sửa trong hồ sơ.
- Trên điện thoại, mỗi dòng thành một thẻ có nhãn; không bắt cuộn ngang để tìm thao tác.

Giữ nguyên quyền ADMIN phía máy chủ và các chặn xóa tài khoản có lịch sử. Không đổi schema, dữ liệu hay quyền của Trưởng khoa.

Kiểm tra: unit test lọc kết hợp và tách vai trò; nghiệm thu riêng tạo 22 giảng viên để kiểm tra phân trang, tìm/lọc, sửa nhanh, popup môn, form thêm mới và màn hình 390px. Các hành trình bổ nhiệm Trưởng khoa và popup cũ được cập nhật theo bố cục mới.
