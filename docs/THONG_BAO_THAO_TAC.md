# Thông báo thao tác

- Các biểu mẫu quản trị dùng chung `useActionFeedback`: tạo/sửa/xóa khoa, người dùng, mẫu khảo sát; lớp, học kỳ, ghi danh, phân công; tạo/sửa/hủy/công bố/đóng đợt và xét duyệt.
- Thành công màu xanh, lỗi màu đỏ. Thông báo xuất hiện góc phải dưới; thông báo mới nằm dưới và đẩy thông báo cũ lên. Mỗi thông báo tự tắt sau 5 giây tính từ lúc xuất hiện, hoặc đóng bằng nút ×.
- Thông báo nằm trên ô sửa nhanh; không lấy tiêu điểm khỏi biểu mẫu. Thành phần ở khung gốc giữ thông báo khi chuyển trang.
- Các thao tác máy chủ chuyển trang dùng cookie phản hồi ngắn hạn, chỉ chứa thông điệp xác nhận, không chứa dữ liệu tài khoản. Cookie được xóa sau khi đọc để tải lại trang không phát lại thông báo.
- Hồ sơ, đổi mật khẩu, ảnh đại diện và đánh dấu thông báo đã đọc cũng có phản hồi. Tự lưu bản nháp, lọc và xem thông tin không phát thông báo thao tác liên tục.

Kiểm tra: `src/lib/action-feedback.test.ts`, `tests/e2e/action-feedback.spec.ts`; nghiệm thu dùng database tạm, không tạo dữ liệu trong database ứng dụng.
