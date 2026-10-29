# Bộ dữ liệu mẫu bổ sung

Chạy `npm run db:demo` từ thư mục dự án để thêm bộ mẫu vào database được cấu hình trong `.env`. Lệnh này không xóa dữ liệu cũ, không đặt lại mật khẩu và không sửa các đợt khảo sát đang có. Không dùng `db:seed` để bổ sung dữ liệu vì đó là script khởi tạo lại dữ liệu cũ.

## Thành phần

- 5 khoa: Công nghệ thông tin, Cơ khí, Điện Điện tử, Kinh tế, Ngoại ngữ; mã bắt đầu bằng `DEMO-`.
- Mỗi khoa có 4 giảng viên, trong đó 1 người có thêm quyền Trưởng khoa; tổng cộng 20 giảng viên và 5 Trưởng khoa nằm trong số đó.
- Mỗi khoa có 10 sinh viên, chia vào 2 lớp hành chính; tổng cộng 50 sinh viên.
- Mỗi khoa có 10 môn, được phân công cho giảng viên cùng khoa; tổng cộng 50 môn.
- Một học kỳ mẫu 2026–2027, 50 lớp học phần không gắn giảng viên, có hệ đào tạo và sĩ số kế hoạch 40.
- Mỗi sinh viên đăng ký 5 môn trong khoa với các tổ hợp khác nhau; tổng cộng 250 lượt ghi danh.

## Tài khoản

File `TAI_KHOAN_MAU.md` ở thư mục gốc ghi đủ 70 email, mật khẩu và vai trò theo khoa, cùng danh sách môn. Mật khẩu riêng cho từng tài khoản, sinh ngẫu nhiên; trong database chỉ lưu bản băm Argon2. File được loại khỏi Git. Tài khoản admin và các tài khoản có từ trước không được đặt lại mật khẩu.

Chạy lại lệnh sẽ kiểm tra bộ dữ liệu và mật khẩu hiện có, không tạo trùng và không cập nhật đè. Nếu file bị mất, mật khẩu đã được đổi hoặc bộ mẫu bị sửa một phần, script sẽ dừng thay vì tự đặt lại. Giữ file này để tra cứu đăng nhập. Không dùng tài khoản mẫu cho môi trường thật.

Sau khi chạy, đăng nhập admin để xem danh sách sinh viên và giảng viên hoặc tạo khảo sát theo khoa. Script không tự tạo, công bố hay thêm người nhận vào các khảo sát đã có. Mỗi lần chạy thành công đều kiểm tra số lượng, quyền, khoa, môn đăng ký, đối chiếu 70 mật khẩu; lần tạo mới còn kiểm tra tài khoản cũ giữ nguyên email và mật khẩu băm.
