# Khảo sát môn học và giảng viên — cập nhật 02/11/2026

## Quy tắc nghiệp vụ

- Quản trị viên tạo đợt theo kế hoạch đã được phê duyệt bên ngoài hệ thống. Trưởng khoa chỉ xem kết quả trong khoa, không duyệt lại đợt.
- Khảo sát chung của trường/khoa chỉ có phần chung nếu không chọn đánh giá môn/giảng viên.
- **Đánh giá môn học (COURSE):** một phần cho mỗi môn sinh viên đã đăng ký trong học kỳ và thuộc danh sách môn của đợt. Nội dung này đánh giá môn, không phải điểm cá nhân giảng viên.
- **Đánh giá giảng viên (LECTURER):** một phần cho mỗi cặp môn–giảng viên thực sự dạy lớp học phần sinh viên đã đăng ký. Hai người cùng dạy một môn có hai phần riêng; cùng một người dạy một môn qua nhiều lớp đã đăng ký chỉ nhận một phần cho cặp đó.
- Mỗi đợt vẫn chọn một trong hai đối tượng đánh giá; không tự nhân đôi câu hỏi môn học thành câu hỏi giảng viên. Muốn khảo sát hai mục tiêu khác nhau, quản trị viên dùng mẫu và đợt phù hợp cho từng mục tiêu.
- Người nhận, môn và giảng viên được chốt khi công bố. Việc sửa đăng ký/phân công sau đó không sửa phiếu và kết quả cá nhân của đợt cũ.
- Phần chung trả lời một lần; mẫu riêng được lặp theo môn hoặc cặp môn–giảng viên, với khóa trả lời riêng. Máy chủ kiểm tra đúng đối tượng, thời hạn, quyền tài khoản và chống gửi trùng.

## Trang sinh viên

- Thẻ khảo sát phân biệt khảo sát chung, chất lượng môn học và đánh giá giảng viên; có thể mở danh sách đối tượng trước khi làm.
- Phiếu chia thành từng phần, hiện rõ môn và người được đánh giá. Chuyển phần bằng danh sách hoặc nút trước/tiếp theo; điện thoại dùng danh sách chọn gọn. Câu trả lời vẫn được giữ.
- Tiến độ toàn phiếu và từng phần, đánh dấu câu không bắt buộc. Bấm gửi khi còn thiếu/sai sẽ mở và đưa con trỏ đến câu cần kiểm tra đầu tiên.
- Lưu bản nháp lưu tất cả các phần. Mở lại ưu tiên phần còn câu bắt buộc chưa điền. Lưu bản nháp là thao tác chủ động, chưa có tự động lưu.
- Gửi phản hồi nộp toàn bộ phiếu một lần. Không sửa bài sau khi gửi.

## Trang giảng viên

- Phân biệt rõ kết quả đánh giá cá nhân và kết quả chung của môn; trên thẻ đợt hiện tên môn thuộc phạm vi.
- Xem phân công lớp học phần hiện tại theo học kỳ, số sinh viên đăng ký và thông báo phân biệt phân công hiện tại với danh sách đã chốt của đợt cũ.
- Kết quả cá nhân chỉ lấy đúng giảng viên đã chốt trong phiếu, không trộn điểm người cùng dạy và không cho giảng viên mới xem đánh giá cá nhân của người cũ.
- Kết quả chung của môn cho người phụ trách môn hoặc người thực dạy trong học kỳ được xem. Bổ sung trường hợp đồng giảng; không dùng giảng viên cũ trên trường dữ liệu lịch sử khi lớp đã cập nhật phân công mới.
- Báo cáo chỉ mở khi đóng/hết hạn và đủ ngưỡng. Từng phần chưa đủ phản hồi được ghi rõ; từng câu thiếu ngưỡng vẫn ẩn điểm/góp ý.
- Không hiển thị danh tính sinh viên trong báo cáo. Xuất CSV vẫn áp dụng cùng phạm vi quyền xem.

## Kiểm tra

- Unit: gom câu hỏi theo đúng cặp môn–giảng viên, thứ tự ổn định, quyền đồng giảng và ngưỡng báo cáo.
- Nghiệm thu trình duyệt trên database riêng: công bố, thay người dạy sau công bố, phiếu có hai giảng viên, kiểm tra thiếu câu, lưu/mở lại bản nháp, gửi qua giao diện, tách điểm từng người, chặn người ngoài, kết quả môn chung và hiển thị trên điện thoại.
- Không đổi schema, không chạy seed và không sửa phản hồi trong database ứng dụng.
- Kết quả nghiệm thu: 94 unit test và 20 kịch bản trình duyệt đều đạt; TypeScript, lint, Prisma validate và production build đạt.
