# Nhập dữ liệu, nhắc hạn và khai thác kết quả

Cập nhật ngày 10/11/2026.

## Nhập dữ liệu

- Admin mở Nhập dữ liệu hàng loạt. Nhận CSV UTF-8, tối đa 200 KB và 200 dòng. Có thể mở mẫu bằng Excel và lưu lại dưới dạng CSV UTF-8, không nhận trực tiếp XLSX.
- Sinh viên: `name,email,studentCode,academicClassCode`. Giảng viên: `name,email,lecturerCode,facultyCode,dean`, cột dean dùng yes/no. Mật khẩu khởi tạo nhập riêng trên giao diện, không nằm trong tệp.
- Phân công: `semesterName,academicClassCode,courseClassCode`. Tên học kỳ phải tồn tại và duy nhất. Mã khoa và lớp đã tạo trước, không tự tạo danh mục từ lỗi gõ.
- Xem trước chỉ đọc dữ liệu, báo lỗi từng dòng. Xác nhận nhập kiểm tra lại trong giao dịch: tất cả đạt thì ghi toàn bộ, có lỗi thì không ghi một phần.
- Không cập nhật hoặc ghi đè tài khoản hiện có. Phân công thay toàn bộ danh sách chung của từng lớp/học kỳ có trong tệp. Phải đưa đủ các môn muốn giữ, không nhận hai lớp học phần cùng môn. Không đổi phiếu đã công bố hoặc ngoại lệ học riêng.

## Nhắc sinh viên

- Admin mở tiến độ của đợt đang tiếp nhận và bấm Gửi lời nhắc trong web.
- Chỉ người được giao phiếu, chưa hoàn thành, tài khoản hoạt động và còn quyền sinh viên nhận thông báo. Không tìm danh tính từ bảng bài nộp ẩn danh.
- Mỗi đợt tối đa một lượt nhắc trong 24 giờ, áp dụng chung cho mọi Admin. Không gửi khi chưa bắt đầu, hết hạn hoặc đã đóng.
- Đây là lời nhắc chủ động trong ứng dụng, không có lịch chạy tự động, email hoặc push.

## Đối chiếu và nhận xét

- Menu Kết quả và hướng cải thiện dành cho Admin, Trưởng khoa và Giảng viên.
- Chỉ đợt đánh giá giảng viên đã đóng hoặc hết hạn và đạt điều kiện báo cáo mới mở được điểm.
- Admin đối chiếu toàn hệ thống. Trưởng khoa chỉ các đợt thuộc khoa mình. Giảng viên chỉ xem điểm và viết hướng cải thiện của bản thân.
- Đối chiếu giữa các giảng viên trong cùng môn và đợt, dùng cùng bộ câu hỏi. Danh sách là những người thực sự được giao đánh giá trong đợt, không lấy mọi giảng viên từng dạy môn đó ở học kỳ khác.
- Điểm chung của môn là trung bình có trọng số theo số câu trả lời ở từng tiêu chí của các giảng viên đủ ngưỡng. Bao gồm giảng viên đang chọn. Không lấy trung bình của các ô thiếu ngưỡng.
- Chỉ so sánh câu thang điểm, hiển thị điểm, số trả lời, thang đo và số phiếu có câu trả lời trên số được giao. Không tự quy đổi câu lựa chọn hay tự luận thành điểm, không tự xếp hạng.
- Tiêu chí dưới điểm giữa của thang được đánh dấu cần xem xét, không phải kết luận hoặc xếp loại chất lượng giảng viên. Khác lớp, hệ học và tỷ lệ tham gia có thể ảnh hưởng kết quả.
- Đối chiếu học kỳ phải cùng môn, giảng viên, câu hỏi trùng nội dung, cùng cận và bước thang đo. Câu hỏi trùng lặp gây nhập nhằng, không tương thích hoặc thiếu ngưỡng được để trống. Chênh lệch không chứng minh nguyên nhân cải thiện.

## Luồng báo cáo

- Giảng viên viết nhận xét và hướng cải thiện, gửi Trưởng khoa cùng Admin.
- Trưởng khoa viết nhận xét đối chiếu trong khoa và gửi Admin. Không thêm quy trình duyệt khảo sát.
- Bản nháp chỉ tác giả thấy và sửa. Bản gửi không sửa, lưu ảnh chụp số liệu và thời điểm làm căn cứ. Nội dung gốc của khảo sát giữ nguyên.
- Admin xem các bản đã gửi, dùng In / Lưu PDF để xuất báo cáo cho nhà trường. Không có vai trò Nhà trường mới và không tự gửi email hoặc thông điệp bên ngoài.
- Nhận xét không chứa tên hoặc mã sinh viên, ảnh chụp chỉ có số liệu tổng hợp đủ ngưỡng. Các thao tác nhập, nhắc và lưu/gửi nhận xét có nhật ký nghiệp vụ.

## Dữ liệu

Migration `20261110000000_result_notes` chỉ thêm bảng ResultNote và quan hệ với người lập, đợt khảo sát. Không xóa hay làm lại dữ liệu hiện có. `courseId` và `lecturerId` trong bảng nhận xét là mã ngữ cảnh của ảnh chụp lịch sử, không phải khóa ngoại. Các điểm thấp, biểu đồ và chênh lệch dùng để hỗ trợ đọc kết quả, không tự kết luận thi đua.
