# Đánh giá từng giảng viên thực dạy

1. Admin vào **Lớp học phần**, tìm đúng lớp và mở **Phân công / Cập nhật**. Chọn một hoặc nhiều giảng viên thực sự dạy lớp, rồi lưu. Chỉ chọn người đang hoạt động, có vai trò giảng viên và thuộc khoa của môn.
2. Tạo/sửa đợt nháp theo khoa, chọn mẫu phần môn và các môn. Ở **Đối tượng đánh giá**, chọn **Từng giảng viên thực sự dạy lớp đã đăng ký**. Mẫu phần môn được dùng làm bộ câu hỏi cho từng giảng viên.
3. Kiểm tra người nhận và người dạy tại trang xem trước. Khi công bố, hệ thống lấy giảng viên của đúng lớp sinh viên đăng ký trong đúng học kỳ, không lấy tất cả giảng viên được phân công môn.
4. Lớp đồng giảng có một phần cho từng người dạy. Sinh viên học nhiều lớp cùng môn, cùng người dạy vẫn chỉ đánh giá cặp môn–giảng viên đó một lần. Thiếu phân công hoặc giảng viên không còn hợp lệ sẽ chặn công bố và hoàn tác toàn bộ giao phiếu.
5. Người dạy được chốt vào phiếu. Đổi phân công sau công bố không đổi phiếu, không chuyển kết quả cũ cho giảng viên mới. Câu trả lời ngoài danh sách đã giao bị từ chối khi lưu nháp hoặc gửi.
6. Admin và Trưởng khoa xem kết quả tách theo môn–giảng viên; giảng viên chỉ xem phần của chính mình. Mỗi phần và từng câu kiểm tra ngưỡng ẩn danh riêng. Kết quả/CSV mở sau khi đóng hoặc hết hạn.

## Tương thích dữ liệu

- Migration chỉ thêm bảng/cột và khóa ngoại. Mọi đợt đã có mặc định ở chế độ `COURSE`, không chuyển câu trả lời cũ sang giảng viên bằng suy đoán.
- Phân công một giảng viên trong cột lớp cũ vẫn được dùng nếu lớp chưa có phân công mới. Khi admin lưu phân công mới, hệ thống đánh dấu dùng phân công mới và giữ cột cũ phục vụ báo cáo lịch sử. Xóa hết phân công mới sẽ không tự khôi phục người cũ.
- Bộ dữ liệu mẫu có lớp chưa phân công giảng viên: cần phân công trước khi công bố chế độ mới. Đánh giá chung môn vẫn dùng được như trước.
- Chạy migration trước khi mở phiên bản mới: `npm run db:migrate`. Không chạy seed/reset.
- Bảng câu trả lời không thêm mã sinh viên. Các phần theo giảng viên chỉ thêm định danh người được đánh giá.
