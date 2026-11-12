# Báo cáo chuẩn Excel và nhắc hạn

Cập nhật 13/11/2026.

## Báo cáo tải trực tiếp

- Kết quả tổng hợp có nút Tải PDF chuẩn và Tải Excel. CSV cũ vẫn giữ lại.
- Mẫu PDF thống nhất gồm đơn vị, tên báo cáo, mã tham chiếu, người lập, ngày xuất, đợt, phạm vi, học kỳ, thời gian tiếp nhận, tiến độ và kết quả từng tiêu chí. Có phông tiếng Việt nhúng trong tệp, tự xuống dòng, ngắt trang và đánh số trang.
- Excel là XLSX thật, có trang thông tin và trang kết quả, dòng tiêu đề cố định, độ rộng cột và xuống dòng. Dữ liệu dạng chữ được ghi dưới dạng chuỗi, không tạo công thức từ góp ý.
- Admin mở bản nhận xét đã gửi để tải PDF báo cáo hoặc Excel báo cáo cho nhà trường. Tệp lấy từ ảnh chụp số liệu của bản đã gửi, kèm nhận xét và hướng cải thiện, không lấy lại điểm mới để thay đổi căn cứ cũ.
- Kiểm tra quyền và ngưỡng ẩn danh trên máy chủ trước khi tạo tệp. Giảng viên chỉ xuất phạm vi giảng dạy của mình, Trưởng khoa chỉ khoa mình. Chỉ Admin xuất bản nhận xét gửi nhà trường. Không xuất tên hoặc mã sinh viên trong bài trả lời.

## Nhập Excel trực tiếp

- Trang nhập hàng loạt có Tải Excel mẫu và vẫn giữ Tải CSV mẫu.
- Nhận trực tiếp .xlsx hoặc CSV UTF-8, tối đa 200 KB, 200 dòng dữ liệu và một trang tính. Không nhận định dạng .xls hoặc .xlsm.
- Giữ tên cột và thứ tự theo mẫu, dùng văn bản cho mã sinh viên, mã lớp và tên học kỳ. Từ chối ô công thức, liên kết, ô ngày và kiểu dữ liệu phức tạp để không nhập nhầm kết quả tính toán hoặc mã bị chuyển đổi.
- Có giới hạn khi giải nén để chặn tệp Excel phình to. Luồng kiểm tra từng dòng, chống trùng tài khoản và xác nhận trước khi ghi vẫn dùng nghiệp vụ cũ.

## Nhắc tự động và nhắc tay

- Khi máy chủ Node.js của web chạy, kiểm tra ngay khi khởi động và mỗi 15 phút. Chỉ nhắc đợt đã bắt đầu, còn tiếp nhận, còn tối đa 72 giờ trước hạn cuối.
- Chỉ sinh viên được giao phiếu, chưa hoàn thành, tài khoản còn hoạt động và có quyền sinh viên nhận thông báo. Không tạo email, không truy ra người gửi từ bài nộp ẩn danh.
- Tự động và nhắc tay dùng chung dấu nhận diện và lịch sử thông báo để tránh gửi cùng người trong 24 giờ. Khóa duy nhất theo đợt, người nhận và ngày Việt Nam chặn gửi trùng khi nhiều tiến trình cùng kiểm tra.
- Nút nhắc tay của Admin vẫn hoạt động, mỗi đợt tối đa một lượt thủ công mỗi 24 giờ. Người đã được nhắc tự động trong 24 giờ được bỏ qua, người chưa được nhắc vẫn có thể nhận lời nhắc thủ công.
- Mỗi lượt tự động xử lý tối đa 500 sinh viên mỗi đợt. Các sinh viên còn lại được xử lý ở lượt kiểm tra tiếp theo. Tài khoản đã hoàn thành không nhận thêm lời nhắc ở lượt sau.
- Nếu tắt máy hoặc dừng web thì bộ nhắc không chạy. Khi mở lại, chỉ nhắc những đợt vẫn còn hiệu lực. Khi triển khai cần giữ tiến trình máy chủ hoạt động liên tục, không dùng bộ hẹn giờ này trên môi trường serverless ngủ sau mỗi yêu cầu.

## Đổi mật khẩu

Giữ nghiệp vụ đang có: xác thực mật khẩu cũ, mật khẩu mới ít nhất 8 ký tự, xác nhận trùng mật khẩu mới và khác mật khẩu cũ. Không bổ sung email, OTP hoặc thay đổi cách đăng nhập ở đợt cập nhật này.
