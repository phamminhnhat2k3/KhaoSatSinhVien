# Trau chuốt ba vai trò — 01/11/2026

## Sinh viên

- Trang “Khảo sát của tôi” có thống kê, danh sách phiếu đang mở/chờ bắt đầu, đã hoàn thành và đã kết thúc nhưng chưa gửi. Phiếu hết hạn không biến mất khỏi lịch sử.
- Thêm tìm tên khảo sát, kết hợp lọc học kỳ và trạng thái; có xóa bộ lọc và hướng dẫn khi không tìm thấy.
- Bản nháp có nút “Tiếp tục khảo sát”. Phiếu chưa tới giờ không có nút làm; phiếu đã gửi không cho sửa.
- Khi làm bài, hiển thị số câu đã điền, số câu bắt buộc còn trống, thanh tiến độ và nhắc thay đổi chưa lưu. Chỉ đếm câu có nội dung, không thay thế kiểm tra hợp lệ khi gửi.
- Tiếp tục dùng nút lưu nháp hiện có; không thêm tự động lưu. Có đường quay lại danh sách và thanh thao tác dễ tìm.

## Giảng viên và Trưởng khoa

- Bố cục tổng quan, trạng thái và thời gian thống nhất; tìm tên đợt, lọc học kỳ và trạng thái. Khi chọn đợt, giữ bộ lọc và dẫn xuống kết quả.
- Đợt chưa kết thúc vẫn giải thích được điều kiện mở báo cáo. Không gọi “đã xem được” chỉ dựa vào trạng thái, vì còn kiểm tra ngưỡng phản hồi.
- Báo cáo có tỷ lệ tham gia trong phạm vi được phép, số bài, lọc phần đánh giá, điểm trung bình, phân bố lựa chọn dạng thanh và góp ý.
- CSV tiếp tục xuất toàn bộ báo cáo được phân quyền, không chỉ phần đang lọc; giao diện có giải thích điều này.
- Bỏ số phiếu toàn đợt trên thẻ Giảng viên để tránh nhầm với phản hồi dành cho giảng viên đó. Không hiển thị bản nháp quản trị.

## Quyền và dữ liệu

Giữ nguyên kiểm tra máy chủ về đối tượng nhận phiếu, thời hạn, gửi một lần, phạm vi môn/giảng viên/khoa và ngưỡng phản hồi. Trưởng khoa chỉ xem, không quản lý giảng viên hoặc xét duyệt. Không migration hay sửa dữ liệu ứng dụng.

## Kiểm tra

Các test mới kiểm tra bộ lọc kết hợp, liên kết giữ bộ lọc và cách đếm câu đã điền. Nghiệm thu trình duyệt trên database riêng kiểm tra trạng thái sinh viên, lưu/khôi phục nháp, bộ lọc, báo cáo đúng phạm vi, câu bị ẩn và màn hình 390px cho cả ba vai trò.
