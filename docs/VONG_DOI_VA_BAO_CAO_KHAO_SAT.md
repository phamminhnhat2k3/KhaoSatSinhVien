# Vòng đời và kết quả khảo sát

- Admin chọn **Sửa đợt nháp** để đổi phạm vi, học kỳ, mẫu, môn và thời gian trước khi giao phiếu. Bản nháp đã có người nhận hoặc đợt cũ theo lớp không được sửa bằng biểu mẫu mới.
- Lưu chỉnh sửa xóa kết quả xét duyệt cũ và gửi khoa duyệt lại. Máy chủ kiểm tra trạng thái ngay khi ghi; đợt vừa được công bố ở cửa sổ khác sẽ không bị ghi đè.
- **Tạo bản sao đợt** điền sẵn cấu hình vào biểu mẫu. Chỉ tạo bản nháp mới sau khi admin lưu; không sao chép phiếu, phản hồi, trạng thái hoặc kết quả duyệt.
- Trong trang xem và công bố, mở **Hủy đợt khảo sát**, xác nhận rồi hủy. Giữ đợt và lịch sử, không xóa dữ liệu. Chỉ hủy bản nháp.
- **Tiến độ / Tổng hợp kết quả** hiển thị số phiếu được giao, đã/chưa hoàn thành và tỷ lệ. Kết quả và CSV mở sau khi đóng hoặc hết hạn, vẫn kiểm tra ngưỡng ẩn danh. Có lọc phần đánh giá, điểm trung bình, phân bố lựa chọn và nội dung tự luận.
- Câu bỏ trống không tính là người đã trả lời câu đó. Các câu chưa đủ ngưỡng được ẩn kết quả, kể cả tự luận, để tránh lộ nhóm nhỏ.
- Đợt công bố được phân biệt theo thời gian: **Chờ bắt đầu → Đang tiếp nhận → Hết hạn**. **Đã đóng** là admin kết thúc chủ động. Các mốc tính theo ngày Việt Nam; đúng thời điểm kết thúc vẫn nhận bài, sau đó ngừng nhận.
- Hết hạn tự có hiệu lực khi đọc/ghi dữ liệu, không cần chạy tác vụ nền hay thay đổi trạng thái database. Sinh viên thấy thời điểm bắt đầu của phiếu chờ mở và không có nút làm trước giờ.
- Nghiệm thu cũ đã chuyển sang fixture riêng; chạy `npm run test:e2e:isolated` sẽ thực hiện cả ba hành trình admin/sinh viên/giảng viên mà không chạy seed hoặc sửa database ứng dụng.
