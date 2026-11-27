# Bộ dữ liệu demo theo lớp hành chính

Ngày chuẩn bị: 06/11/2026. Chỉ dùng để trình bày và thử nghiệm, toàn bộ hồ sơ và phản hồi bổ sung là giả lập.

## Quy mô

- Giữ lại tài khoản Admin hiện có, xóa tài khoản ngoài nhóm Admin và dữ liệu nghiệp vụ cũ.
- 5 khoa: Công nghệ thông tin, Cơ khí, Điện Điện tử, Kinh tế và Ngoại ngữ.
- Mỗi khoa có 3 lớp hành chính, tương ứng Chính quy, Vừa học vừa làm và Đào tạo từ xa.
- Mỗi lớp có 5 sinh viên, tổng cộng 75 sinh viên. Sinh viên thuộc khóa 2025.
- 20 giảng viên, trong đó 5 người kiêm Trưởng khoa. Một giảng viên dạy nhiều lớp.
- 2 học kỳ: HK2 2025–2026 để xem lịch sử/kết quả và HK1 2026–2027 để thử các thao tác hiện tại.
- 40 môn, mỗi khoa 8 môn chia đều cho hai học kỳ. Mỗi lớp học 4 môn trong mỗi học kỳ.
- 120 phân công chung, 2 nhóm học riêng cho hai trường hợp đổi người dạy. Các nhóm đều có giảng viên thực dạy và hệ học phù hợp lớp hành chính.

## Khảo sát

Có 5 mẫu: trải nghiệm học tập chung, môn học và giảng viên, cơ sở vật chất toàn trường, tư vấn học tập thang 10 và thực hành thang 100. Hai mẫu cuối chưa được dùng để thử sửa và xóa. Mẫu đã sử dụng có thể được thử chỉnh thành phiên bản mới theo quy tắc hiện có của web.

20 đợt gồm 6 đợt đã đóng, 6 đợt đang mở, 6 bản nháp, 1 đợt chờ bắt đầu và 1 đợt đã hủy. Các đợt của khoa dùng chế độ đánh giá từng giảng viên thực dạy. Đợt toàn trường chỉ có câu hỏi chung.

Có 305 phiếu được giao, 170 bài nộp mô phỏng và 15 bản nháp sinh viên. Các câu hỏi tự luận là tự nguyện. Bài nộp không lưu liên kết định danh sinh viên. Báo cáo vẫn tuân thủ ngưỡng ẩn danh của ứng dụng. Để xem đủ nhóm lớp 5 người, ngưỡng báo cáo cần không lớn hơn 5. Công cụ sẽ dừng nếu cấu hình không phù hợp, không tự đổi cấu hình này.

Sinh viên đuôi 01/06/11 chưa làm khảo sát khoa hiện tại, 02/07/12 có bản nháp, 03/08/13 đã hoàn thành. Hai ngoại lệ học khác nằm ở `sv.cntt05@demo.vn` và `sv.ck10@demo.vn`, chỉ đổi nhóm của một môn ở HK1 và vẫn học bốn môn.

## Tài khoản và hướng dẫn

File `TAI_KHOAN_MAU.md` tại thư mục gốc chứa tài khoản demo, mật khẩu mẫu, danh sách lớp, phân công từng môn và các bước thử. File được công khai cùng dự án để dùng trang `/accounts`; tài khoản Admin không nằm trong danh sách này. Email giảng viên thường có dạng `gv.cntt2@demo.vn`, Trưởng khoa `tk.cntt@demo.vn`, sinh viên `sv.cntt01@demo.vn`.

## Chạy lại bộ demo

Xem kế hoạch mà chưa sửa dữ liệu:

```powershell
node --env-file=.env --import tsx prisma/reset-demo.ts
```

Thay toàn bộ dữ liệu nghiệp vụ bằng bộ này, giữ các tài khoản Admin:

```powershell
node --env-file=.env --import tsx prisma/reset-demo.ts --apply
```

Lệnh có `--apply` sẽ sao lưu bằng MySQL 8.0, khôi phục thử vào database tạm và đối chiếu số dòng trước khi thay dữ liệu trong một transaction. Nếu tạo dữ liệu lỗi, giao dịch được hoàn tác. Các file SQL, thông tin xác minh, tài khoản cũ và mới được lưu dưới `.data/backups/` và không đưa vào Git.

Sau khi hoàn tất, công cụ xác minh mật khẩu, số lượng dữ liệu, bốn môn của từng sinh viên và khả năng mở các báo cáo đã đóng. Không chạy `db:seed`, `db:demo` hoặc `db:report-demo` cũ để bổ sung vào bộ này vì chúng dùng các cấu trúc dữ liệu mẫu khác.

## Kết quả nghiệm thu lần nạp đầu

Đã giữ 1 Admin, tạo tổng cộng 96 tài khoản và xác minh mật khẩu của toàn bộ tài khoản. 111 bài test và 23 kịch bản Playwright đạt. TypeScript, ESLint, Prisma validate và build Next.js đạt. Bản sao lưu dữ liệu cũ đã khôi phục thử và đối chiếu số dòng trước khi thay dữ liệu.

Đã kiểm tra trực tiếp website local: đăng nhập đủ bốn vai trò, sinh viên nhận bốn môn, Admin xuất CSV và giảng viên/Trưởng khoa mở báo cáo đúng quyền. Lần kiểm tra này chỉ đọc, không gửi thêm bài ngoài 170 bài mô phỏng đã chuẩn bị.
