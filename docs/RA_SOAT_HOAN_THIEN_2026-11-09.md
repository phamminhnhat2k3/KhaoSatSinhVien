# Rà soát chức năng ngày 09 tháng 11 năm 2026

## Phạm vi

- Rà lại mã nguồn và thao tác của Admin, Sinh viên, Giảng viên và Trưởng khoa.
- Giữ dữ liệu đang dùng. Kiểm thử thao tác ghi trên database tạm riêng, không chạy lại seed trên database ứng dụng.
- Giữ quy tắc gửi một lần, chốt môn và giảng viên khi công bố, bảo vệ danh tính người trả lời.
- Việc có đủ luồng để demo không đồng nghĩa đã hoàn tất các phần mở rộng hoặc đủ điều kiện vận hành thật.

## Các phần đã có

| Nhóm | Hiện trạng |
| --- | --- |
| Tài khoản | Đăng nhập, đăng xuất, bốn vai trò, khóa và mở khóa. Kiểm tra quyền máy chủ |
| Người dùng | Tạo sinh viên, giảng viên, cấp hoặc thu hồi Trưởng khoa, tìm kiếm, lọc, phân trang, sửa nghiệp vụ, xóa có kiểm tra liên quan |
| Khoa | Thêm, sửa, xóa. Chặn xóa khoa còn dữ liệu liên quan |
| Học vụ | Tạo học kỳ, môn, lớp hành chính và lớp học phần. Gắn khoa và hệ học |
| Phân công | Chung theo lớp và học kỳ, mỗi môn một giảng viên. Có điều chỉnh riêng cho sinh viên học khác |
| Mẫu | Kéo thả bốn loại câu hỏi, đổi thứ tự, nhân bản, thang điểm tùy chỉnh, bắt buộc, xem trước, lưu nháp trong trình duyệt, sửa và xóa có bảo toàn phiên bản |
| Đợt khảo sát | Tạo, sửa, sao chép, hủy đợt nháp, chọn học kỳ rồi khoa và lớp, xem trước người nhận, công bố, đóng và chặn nhận bài ngoài thời hạn |
| Giao phiếu | Theo khoa hoặc toàn trường. Môn và giảng viên lấy từ phân công thực học, chốt khi công bố |
| Sinh viên | Xem phiếu được giao, lưu nháp thủ công, tiếp tục, chuyển phần, gửi một lần và xem lịch sử |
| Admin xem kết quả | Tiến độ, bài nộp ẩn danh, báo cáo tổng hợp và CSV |
| Giảng viên | Xem kết quả đúng môn và người dạy. Phần đánh giá cá nhân được tách với kết quả chung của môn |
| Trưởng khoa | Báo cáo của khoa, tra cứu giảng viên và sinh viên, popup Thông tin và Đánh giá. Chỉ đọc trong khoa |
| Hồ sơ | Tự cập nhật thông tin cá nhân, đổi mật khẩu, tải và căn ảnh đại diện |
| Thông báo | Thông báo trong web, bảng trượt, đánh dấu đọc, số chưa đọc và thông báo nhỏ cho thao tác Admin |

Lịch sử sinh viên chỉ cho biết phiếu nào đã hoàn thành và số lượng phiếu. Nội dung bài nộp không được nối với tên sinh viên. Báo cáo tổng hợp vẫn cần đóng hoặc hết hạn và đủ ngưỡng ẩn danh theo phần, theo câu.

## Những lỗi được sửa trong lần rà soát

- Thống nhất kiểm tra ghi danh ở cả lúc tạo sinh viên và lúc bổ sung lớp học phần. Chặn sai khoa, sai hệ, sai học kỳ và hai nhóm cùng môn trong một học kỳ. Đổi nhóm dùng mục Điều chỉnh môn học riêng, không làm thay phiếu đã công bố.
- Lọc lớp học phần trên giao diện theo lớp hành chính đã chọn. Đổi lớp thì bỏ các lựa chọn cũ để tránh gửi nhầm.
- Chuyển lớp và đổi hệ học phải khớp với phân công, ghi danh ở các học kỳ chưa kết thúc. Nếu còn xung đột, hệ thống chặn và hướng dẫn điều chỉnh trước. Không sửa lịch sử học kỳ đã kết thúc.
- Bổ sung thông báo cho giảng viên được phân công bằng quan hệ mới. Khi đóng đợt, thông báo của giảng viên và Trưởng khoa dẫn đúng đợt báo cáo.
- API sinh viên và thông tin phiên kiểm tra trạng thái cùng vai trò hiện tại từ database. Tài khoản đã khóa hoặc mất quyền không tiếp tục đọc phiếu bằng phiên cũ.
- Trang đăng nhập kiểm tra tài khoản hiện tại, tránh vòng chuyển hướng giữa trang đăng nhập và trang chính khi phiên cũ thuộc tài khoản đã khóa.
- JSON lỗi ở API lưu nháp và gửi bài được trả về lỗi dữ liệu thay vì lỗi máy chủ.
- Chặn trang ngoài gửi yêu cầu lưu hoặc nộp phiếu bằng phiên đăng nhập của sinh viên.
- Câu bắt buộc chỉ có khoảng trắng không được tính là đã trả lời. Khoảng trắng trong dữ liệu cũ cũng không được tính để mở ngưỡng báo cáo.
- CSV giữ tiếng Việt, dấu phẩy và xuống dòng, đồng thời ngăn nội dung tự luận bị hiểu thành công thức khi mở bằng phần mềm bảng tính. Báo cáo tải về không được lưu cache công khai.

## Những phần chưa làm

### Cần bổ sung nếu dùng với dữ liệu thật

- Nhập hàng loạt sinh viên, giảng viên và phân công từ Excel hoặc CSV. Hiện tạo và phân công qua giao diện, bộ demo có công cụ riêng.
- Hoàn thiện sửa và xóa cho các danh mục học kỳ, môn học, lớp hành chính và lớp học phần. Hiện mới có các thao tác tạo, phân công, đổi hệ và ghi danh, chưa phải toàn bộ CRUD cho mọi danh mục.
- Quên mật khẩu qua email và thu hồi tất cả phiên đăng nhập khi đổi mật khẩu. Việc khóa tài khoản đã chặn quyền bằng kiểm tra máy chủ, nhưng đổi mật khẩu chưa tự đăng xuất các thiết bị khác.
- Trang tra cứu nhật ký thao tác. Nhật ký đã được ghi trong database, chưa có giao diện quản lý riêng.
- Sao lưu database theo lịch và giao diện khôi phục. Đã có sao lưu, khôi phục thử trước khi thay bộ demo, chưa có sao lưu vận hành tự động.
- Triển khai lên máy chủ để truy cập ngoài local, cấu hình HTTPS và môi trường vận hành.
- Nghiệm thu với dữ liệu thật của trường, kiểm thử tải lớn, nhiều người đồng thời và thiết bị thật. Các kiểm tra hiện có dùng dữ liệu giả lập, trình duyệt tự động và kích thước màn hình mô phỏng.

### Các phần mở rộng chưa triển khai

- Email, push và nhắc hạn khảo sát tự động. Thông báo hiện tại hoạt động trong web.
- Xuất PDF hoặc Excel có định dạng. Hiện xuất CSV, không phải file Excel gốc.
- Báo cáo so sánh xu hướng giữa nhiều học kỳ.
- Đăng nhập tài khoản trường và đồng bộ dữ liệu từ hệ thống đào tạo.
- Câu hỏi rẽ nhánh theo câu trả lời. Các phần theo môn và giảng viên đã có, chưa có trình thiết kế nhánh điều kiện.
- Quy trình phản ánh ngoài khảo sát, giải trình và theo dõi cải tiến nhiều cấp.

Không bổ sung lại bước duyệt của Trưởng khoa. Kế hoạch được duyệt bên ngoài trước khi đơn vị phụ trách tạo khảo sát, đúng phạm vi đã thống nhất.

## Kiểm chứng

- 150 bài kiểm thử tự động đạt. Bộ kiểm tra giao dịch gửi phiếu cũng được chạy riêng và đạt.
- 26 kịch bản nghiệm thu trình duyệt đạt trên MySQL tạm riêng. Có kiểm tra tạo người dùng, ghi danh sai, chuyển lớp, đổi hệ, lưu nháp, gửi bài, phân quyền, thông báo và báo cáo.
- TypeScript, ESLint, Prisma validate và build Next.js đạt. Chín migration đã khớp với database đang dùng.
- Kiểm tra chỉ đọc database ứng dụng ghi nhận 96 tài khoản, 5 khoa, 15 lớp hành chính, 75 sinh viên, 22 đợt và 170 bài nộp. Không phát hiện phân công sai khoa/hệ, trùng môn trong học kỳ hoặc thiếu giảng viên trong dữ liệu hiện tại.
- Đã đăng nhập và kiểm tra các trang chính của cả bốn vai trò trên bản local, gồm giao diện điện thoại mô phỏng.
- Không chạy lại seed, xóa dữ liệu hoặc gửi thêm bài vào database ứng dụng để nghiệm thu. Các dữ liệu và cơ sở dữ liệu thử được dọn riêng.
