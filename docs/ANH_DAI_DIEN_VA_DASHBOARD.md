# Ảnh đại diện và tổng quan người dùng

Trong **Hồ sơ của tôi**, chọn ảnh PNG, JPG hoặc WebP tối đa 2 MB và bấm **Lưu ảnh đại diện**. Giao diện cắt vuông vùng giữa, thu nhỏ thành 512 × 512 pixel và lưu dưới dạng WebP. Ảnh xuất hiện ở header, thanh bên, hồ sơ cá nhân, danh sách người dùng và pop-up tài khoản. Khi chưa có ảnh, hệ thống hiển thị chữ cái đầu tên.

Chỉ người đang đăng nhập được thay ảnh của chính mình; admin không đổi ảnh của tài khoản khác. Máy chủ kiểm tra trạng thái tài khoản, kích thước, định dạng thực tế của tệp và nguồn yêu cầu. Chỉ chủ tài khoản và admin được lấy ảnh qua API; ảnh không được đặt trong thư mục public.

Ảnh được lưu tại `.data/avatars` trên máy chạy web, không đưa vào Git. Khi chuyển máy hoặc triển khai cần sao lưu thư mục này cùng database; không dùng ổ đĩa tạm không bền vững của nền tảng hosting để lưu ảnh lâu dài. Không thay đổi schema MySQL. Việc xóa tài khoản hiện chưa tự dọn tệp ảnh cũ.

Trang **Tất cả người dùng** có biểu đồ tròn dạng vòng và các số tổng, đang hoạt động, đã khóa. Thống kê dùng toàn bộ kết quả phù hợp bộ lọc, không chỉ 20 dòng của trang hiện tại. Mỗi tài khoản được đếm đúng một lần, ưu tiên vai trò Quản trị viên → Trưởng khoa → Giảng viên → Sinh viên; tài khoản chưa có vai trò nằm trong nhóm riêng. Có chú giải số lượng và tỷ lệ, cùng nội dung mô tả cho trình đọc màn hình.
