# Tài khoản và hướng dẫn bộ demo mới

Đăng nhập: http://localhost:3005/login

Mật khẩu chung của tài khoản demo: **vitrung65**. Tài khoản Admin dùng mật khẩu riêng và không có trong danh sách công khai. Database chỉ lưu mật khẩu băm.

Bộ dữ liệu: 2 học kỳ, 5 khoa, 15 lớp hành chính, 75 sinh viên, 20 giảng viên trong đó 5 Trưởng khoa, 40 môn, 122 lớp học phần (120 phân công chung và 2 nhóm học riêng). Mỗi lớp có 5 sinh viên và học 4 môn mỗi học kỳ.

## Các bước nên thử

1. Admin: xem tổng quan, người dùng, 3 hệ học, phân công học kỳ và các mẫu. Hai mẫu có chữ ‘Mẫu thử’ chưa được sử dụng, phù hợp thử sửa/xóa.
2. Mở đợt đã đóng của từng khoa hoặc toàn trường để xem kết quả, từng bài ẩn danh và xuất CSV. Phản hồi đã có đều là dữ liệu mô phỏng.
3. Sinh viên đuôi 01, 06, 11: chưa làm khảo sát giữa học kỳ của khoa. Đuôi 02, 07, 12: có bản nháp. Đuôi 03, 08, 13: đã hoàn thành khảo sát khoa. Tất cả vẫn có thể xem lịch sử HK2.
4. Giảng viên thường: xem phân công và kết quả thuộc môn/người dạy của mình. Trưởng khoa: xem kết quả trong khoa.
5. Admin: sửa hoặc sao chép bản nháp của một khoa, kiểm tra học kỳ → khoa → lớp, xem trước rồi công bố nếu muốn. Đợt nháp mới chỉ chọn lớp Chính quy để dễ kiểm tra giới hạn người nhận.
6. Thử đợt toàn trường đang mở. Đợt này chỉ có câu hỏi chung về cơ sở vật chất, không có phần môn học hoặc giảng viên.
7. Thử bộ lọc Chờ bắt đầu và Đã hủy. Đợt chờ bắt đầu chỉ giao cho lớp Chính quy CNTT.
8. Thử thông báo ở Admin, Sinh viên, Giảng viên, Trưởng khoa và hồ sơ/đổi ảnh đại diện bằng tài khoản mẫu.

## Khoa Công nghệ thông tin (CNTT)

### Giảng viên và Trưởng khoa

| Mã | Họ tên | Vai trò | Email đăng nhập | Mật khẩu |
|---|---|---|---|---|
| GV-CNTT-1 | Nguyễn Minh Anh | Trưởng khoa + Giảng viên | tk.cntt@demo.vn | vitrung65 |
| GV-CNTT-2 | Trần Quốc Bảo | Giảng viên | gv.cntt2@demo.vn | vitrung65 |
| GV-CNTT-3 | Lê Hoàng Phúc | Giảng viên | gv.cntt3@demo.vn | vitrung65 |
| GV-CNTT-4 | Phạm Thị Mai | Giảng viên | gv.cntt4@demo.vn | vitrung65 |

### CNTT25-CQ — Chính quy

Công nghệ thông tin khóa 2025 · Chính quy. 5 sinh viên, 4 môn mỗi học kỳ.

| MSSV | Họ tên | Email đăng nhập | Mật khẩu |
|---|---|---|---|
| 25CNTT01 | Nguyễn Minh Nhật | sv.cntt01@demo.vn | vitrung65 |
| 25CNTT02 | Nguyễn Văn Sang | sv.cntt02@demo.vn | vitrung65 |
| 25CNTT03 | Nguyễn Thảo Nguyên | sv.cntt03@demo.vn | vitrung65 |
| 25CNTT04 | Nguyễn Hoàng Nam | sv.cntt04@demo.vn | vitrung65 |
| 25CNTT05 | Nguyễn Ngọc Anh | sv.cntt05@demo.vn | vitrung65 |

| Học kỳ | Mã môn | Môn học | Lớp học phần | Giảng viên thực dạy |
|---|---|---|---|---|
| Học kỳ 2 · 2025–2026 | CNTT101 | Nhập môn lập trình | CNTT101-1-HK2 | Nguyễn Minh Anh (tk.cntt@demo.vn) |
| Học kỳ 2 · 2025–2026 | CNTT102 | Cấu trúc dữ liệu và giải thuật | CNTT102-1-HK2 | Trần Quốc Bảo (gv.cntt2@demo.vn) |
| Học kỳ 2 · 2025–2026 | CNTT103 | Cơ sở dữ liệu | CNTT103-1-HK2 | Lê Hoàng Phúc (gv.cntt3@demo.vn) |
| Học kỳ 2 · 2025–2026 | CNTT104 | Lập trình hướng đối tượng | CNTT104-1-HK2 | Phạm Thị Mai (gv.cntt4@demo.vn) |
| Học kỳ 1 · 2026–2027 | CNTT105 | Mạng máy tính | CNTT105-1-HK1 | Trần Quốc Bảo (gv.cntt2@demo.vn) |
| Học kỳ 1 · 2026–2027 | CNTT106 | Công nghệ phần mềm | CNTT106-1-HK1 | Lê Hoàng Phúc (gv.cntt3@demo.vn) |
| Học kỳ 1 · 2026–2027 | CNTT107 | Lập trình Web | CNTT107-1-HK1 | Phạm Thị Mai (gv.cntt4@demo.vn) |
| Học kỳ 1 · 2026–2027 | CNTT108 | Trí tuệ nhân tạo | CNTT108-1-HK1 | Nguyễn Minh Anh (tk.cntt@demo.vn) |

### CNTT25-VLVH — Vừa học vừa làm

Công nghệ thông tin khóa 2025 · Vừa học vừa làm. 5 sinh viên, 4 môn mỗi học kỳ.

| MSSV | Họ tên | Email đăng nhập | Mật khẩu |
|---|---|---|---|
| 25CNTT06 | Nguyễn Gia Hân | sv.cntt06@demo.vn | vitrung65 |
| 25CNTT07 | Nguyễn Đức Minh | sv.cntt07@demo.vn | vitrung65 |
| 25CNTT08 | Nguyễn Thanh Trúc | sv.cntt08@demo.vn | vitrung65 |
| 25CNTT09 | Nguyễn Quốc Huy | sv.cntt09@demo.vn | vitrung65 |
| 25CNTT10 | Nguyễn Phương Linh | sv.cntt10@demo.vn | vitrung65 |

| Học kỳ | Mã môn | Môn học | Lớp học phần | Giảng viên thực dạy |
|---|---|---|---|---|
| Học kỳ 2 · 2025–2026 | CNTT101 | Nhập môn lập trình | CNTT101-2-HK2 | Trần Quốc Bảo (gv.cntt2@demo.vn) |
| Học kỳ 2 · 2025–2026 | CNTT102 | Cấu trúc dữ liệu và giải thuật | CNTT102-2-HK2 | Lê Hoàng Phúc (gv.cntt3@demo.vn) |
| Học kỳ 2 · 2025–2026 | CNTT103 | Cơ sở dữ liệu | CNTT103-2-HK2 | Phạm Thị Mai (gv.cntt4@demo.vn) |
| Học kỳ 2 · 2025–2026 | CNTT104 | Lập trình hướng đối tượng | CNTT104-2-HK2 | Nguyễn Minh Anh (tk.cntt@demo.vn) |
| Học kỳ 1 · 2026–2027 | CNTT105 | Mạng máy tính | CNTT105-2-HK1 | Lê Hoàng Phúc (gv.cntt3@demo.vn) |
| Học kỳ 1 · 2026–2027 | CNTT106 | Công nghệ phần mềm | CNTT106-2-HK1 | Phạm Thị Mai (gv.cntt4@demo.vn) |
| Học kỳ 1 · 2026–2027 | CNTT107 | Lập trình Web | CNTT107-2-HK1 | Nguyễn Minh Anh (tk.cntt@demo.vn) |
| Học kỳ 1 · 2026–2027 | CNTT108 | Trí tuệ nhân tạo | CNTT108-2-HK1 | Trần Quốc Bảo (gv.cntt2@demo.vn) |

### CNTT25-TX — Đào tạo từ xa

Công nghệ thông tin khóa 2025 · Đào tạo từ xa. 5 sinh viên, 4 môn mỗi học kỳ.

| MSSV | Họ tên | Email đăng nhập | Mật khẩu |
|---|---|---|---|
| 25CNTT11 | Nguyễn Minh Khang | sv.cntt11@demo.vn | vitrung65 |
| 25CNTT12 | Nguyễn Bảo Ngọc | sv.cntt12@demo.vn | vitrung65 |
| 25CNTT13 | Nguyễn Tuấn Kiệt | sv.cntt13@demo.vn | vitrung65 |
| 25CNTT14 | Nguyễn Khánh Linh | sv.cntt14@demo.vn | vitrung65 |
| 25CNTT15 | Nguyễn Hải Đăng | sv.cntt15@demo.vn | vitrung65 |

| Học kỳ | Mã môn | Môn học | Lớp học phần | Giảng viên thực dạy |
|---|---|---|---|---|
| Học kỳ 2 · 2025–2026 | CNTT101 | Nhập môn lập trình | CNTT101-3-HK2 | Lê Hoàng Phúc (gv.cntt3@demo.vn) |
| Học kỳ 2 · 2025–2026 | CNTT102 | Cấu trúc dữ liệu và giải thuật | CNTT102-3-HK2 | Phạm Thị Mai (gv.cntt4@demo.vn) |
| Học kỳ 2 · 2025–2026 | CNTT103 | Cơ sở dữ liệu | CNTT103-3-HK2 | Nguyễn Minh Anh (tk.cntt@demo.vn) |
| Học kỳ 2 · 2025–2026 | CNTT104 | Lập trình hướng đối tượng | CNTT104-3-HK2 | Trần Quốc Bảo (gv.cntt2@demo.vn) |
| Học kỳ 1 · 2026–2027 | CNTT105 | Mạng máy tính | CNTT105-3-HK1 | Phạm Thị Mai (gv.cntt4@demo.vn) |
| Học kỳ 1 · 2026–2027 | CNTT106 | Công nghệ phần mềm | CNTT106-3-HK1 | Nguyễn Minh Anh (tk.cntt@demo.vn) |
| Học kỳ 1 · 2026–2027 | CNTT107 | Lập trình Web | CNTT107-3-HK1 | Trần Quốc Bảo (gv.cntt2@demo.vn) |
| Học kỳ 1 · 2026–2027 | CNTT108 | Trí tuệ nhân tạo | CNTT108-3-HK1 | Lê Hoàng Phúc (gv.cntt3@demo.vn) |

### Đợt khảo sát của khoa

| Tên đợt | Trạng thái mẫu | Trang quản trị |
|---|---|---|
| Công nghệ thông tin · Kết quả HK2 2025–2026 | closed | /admin/campaigns/cmw3xobup001mqgzskwgimbxp/report |
| Công nghệ thông tin · Khảo sát giữa HK1 2026–2027 | open | /admin/campaigns/cmw3xocv400jkqgzsxt4oljme/report |
| Công nghệ thông tin · Bản nháp khảo sát HK1 | draft | /admin/campaigns/cmw3xod3800nyqgzslas3m1ex/review |
| Công nghệ thông tin · Đợt sắp mở HK1 | scheduled | /admin/campaigns/cmw3xoill0430qgzs0kasel1z/report |

## Khoa Cơ khí (CK)

### Giảng viên và Trưởng khoa

| Mã | Họ tên | Vai trò | Email đăng nhập | Mật khẩu |
|---|---|---|---|---|
| GV-CK-1 | Võ Thanh Tùng | Trưởng khoa + Giảng viên | tk.ck@demo.vn | vitrung65 |
| GV-CK-2 | Đặng Ngọc Hà | Giảng viên | gv.ck2@demo.vn | vitrung65 |
| GV-CK-3 | Bùi Văn Hùng | Giảng viên | gv.ck3@demo.vn | vitrung65 |
| GV-CK-4 | Đỗ Thị Lan | Giảng viên | gv.ck4@demo.vn | vitrung65 |

### CK25-CQ — Chính quy

Cơ khí khóa 2025 · Chính quy. 5 sinh viên, 4 môn mỗi học kỳ.

| MSSV | Họ tên | Email đăng nhập | Mật khẩu |
|---|---|---|---|
| 25CK01 | Trần Minh Nhật | sv.ck01@demo.vn | vitrung65 |
| 25CK02 | Trần Văn Sang | sv.ck02@demo.vn | vitrung65 |
| 25CK03 | Trần Thảo Nguyên | sv.ck03@demo.vn | vitrung65 |
| 25CK04 | Trần Hoàng Nam | sv.ck04@demo.vn | vitrung65 |
| 25CK05 | Trần Ngọc Anh | sv.ck05@demo.vn | vitrung65 |

| Học kỳ | Mã môn | Môn học | Lớp học phần | Giảng viên thực dạy |
|---|---|---|---|---|
| Học kỳ 2 · 2025–2026 | CK101 | Vẽ kỹ thuật | CK101-1-HK2 | Võ Thanh Tùng (tk.ck@demo.vn) |
| Học kỳ 2 · 2025–2026 | CK102 | Cơ học kỹ thuật | CK102-1-HK2 | Đặng Ngọc Hà (gv.ck2@demo.vn) |
| Học kỳ 2 · 2025–2026 | CK103 | Sức bền vật liệu | CK103-1-HK2 | Bùi Văn Hùng (gv.ck3@demo.vn) |
| Học kỳ 2 · 2025–2026 | CK104 | Nguyên lý máy | CK104-1-HK2 | Đỗ Thị Lan (gv.ck4@demo.vn) |
| Học kỳ 1 · 2026–2027 | CK105 | Chi tiết máy | CK105-1-HK1 | Đặng Ngọc Hà (gv.ck2@demo.vn) |
| Học kỳ 1 · 2026–2027 | CK106 | Công nghệ chế tạo máy | CK106-1-HK1 | Bùi Văn Hùng (gv.ck3@demo.vn) |
| Học kỳ 1 · 2026–2027 | CK107 | Dung sai và kỹ thuật đo | CK107-1-HK1 | Đỗ Thị Lan (gv.ck4@demo.vn) |
| Học kỳ 1 · 2026–2027 | CK108 | Vật liệu cơ khí | CK108-1-HK1 | Võ Thanh Tùng (tk.ck@demo.vn) |

### CK25-VLVH — Vừa học vừa làm

Cơ khí khóa 2025 · Vừa học vừa làm. 5 sinh viên, 4 môn mỗi học kỳ.

| MSSV | Họ tên | Email đăng nhập | Mật khẩu |
|---|---|---|---|
| 25CK06 | Trần Gia Hân | sv.ck06@demo.vn | vitrung65 |
| 25CK07 | Trần Đức Minh | sv.ck07@demo.vn | vitrung65 |
| 25CK08 | Trần Thanh Trúc | sv.ck08@demo.vn | vitrung65 |
| 25CK09 | Trần Quốc Huy | sv.ck09@demo.vn | vitrung65 |
| 25CK10 | Trần Phương Linh | sv.ck10@demo.vn | vitrung65 |

| Học kỳ | Mã môn | Môn học | Lớp học phần | Giảng viên thực dạy |
|---|---|---|---|---|
| Học kỳ 2 · 2025–2026 | CK101 | Vẽ kỹ thuật | CK101-2-HK2 | Đặng Ngọc Hà (gv.ck2@demo.vn) |
| Học kỳ 2 · 2025–2026 | CK102 | Cơ học kỹ thuật | CK102-2-HK2 | Bùi Văn Hùng (gv.ck3@demo.vn) |
| Học kỳ 2 · 2025–2026 | CK103 | Sức bền vật liệu | CK103-2-HK2 | Đỗ Thị Lan (gv.ck4@demo.vn) |
| Học kỳ 2 · 2025–2026 | CK104 | Nguyên lý máy | CK104-2-HK2 | Võ Thanh Tùng (tk.ck@demo.vn) |
| Học kỳ 1 · 2026–2027 | CK105 | Chi tiết máy | CK105-2-HK1 | Bùi Văn Hùng (gv.ck3@demo.vn) |
| Học kỳ 1 · 2026–2027 | CK106 | Công nghệ chế tạo máy | CK106-2-HK1 | Đỗ Thị Lan (gv.ck4@demo.vn) |
| Học kỳ 1 · 2026–2027 | CK107 | Dung sai và kỹ thuật đo | CK107-2-HK1 | Võ Thanh Tùng (tk.ck@demo.vn) |
| Học kỳ 1 · 2026–2027 | CK108 | Vật liệu cơ khí | CK108-2-HK1 | Đặng Ngọc Hà (gv.ck2@demo.vn) |

### CK25-TX — Đào tạo từ xa

Cơ khí khóa 2025 · Đào tạo từ xa. 5 sinh viên, 4 môn mỗi học kỳ.

| MSSV | Họ tên | Email đăng nhập | Mật khẩu |
|---|---|---|---|
| 25CK11 | Trần Minh Khang | sv.ck11@demo.vn | vitrung65 |
| 25CK12 | Trần Bảo Ngọc | sv.ck12@demo.vn | vitrung65 |
| 25CK13 | Trần Tuấn Kiệt | sv.ck13@demo.vn | vitrung65 |
| 25CK14 | Trần Khánh Linh | sv.ck14@demo.vn | vitrung65 |
| 25CK15 | Trần Hải Đăng | sv.ck15@demo.vn | vitrung65 |

| Học kỳ | Mã môn | Môn học | Lớp học phần | Giảng viên thực dạy |
|---|---|---|---|---|
| Học kỳ 2 · 2025–2026 | CK101 | Vẽ kỹ thuật | CK101-3-HK2 | Bùi Văn Hùng (gv.ck3@demo.vn) |
| Học kỳ 2 · 2025–2026 | CK102 | Cơ học kỹ thuật | CK102-3-HK2 | Đỗ Thị Lan (gv.ck4@demo.vn) |
| Học kỳ 2 · 2025–2026 | CK103 | Sức bền vật liệu | CK103-3-HK2 | Võ Thanh Tùng (tk.ck@demo.vn) |
| Học kỳ 2 · 2025–2026 | CK104 | Nguyên lý máy | CK104-3-HK2 | Đặng Ngọc Hà (gv.ck2@demo.vn) |
| Học kỳ 1 · 2026–2027 | CK105 | Chi tiết máy | CK105-3-HK1 | Đỗ Thị Lan (gv.ck4@demo.vn) |
| Học kỳ 1 · 2026–2027 | CK106 | Công nghệ chế tạo máy | CK106-3-HK1 | Võ Thanh Tùng (tk.ck@demo.vn) |
| Học kỳ 1 · 2026–2027 | CK107 | Dung sai và kỹ thuật đo | CK107-3-HK1 | Đặng Ngọc Hà (gv.ck2@demo.vn) |
| Học kỳ 1 · 2026–2027 | CK108 | Vật liệu cơ khí | CK108-3-HK1 | Bùi Văn Hùng (gv.ck3@demo.vn) |

### Đợt khảo sát của khoa

| Tên đợt | Trạng thái mẫu | Trang quản trị |
|---|---|---|
| Cơ khí · Kết quả HK2 2025–2026 | closed | /admin/campaigns/cmw3xod3c00o2qgzspeykfixm/report |
| Cơ khí · Khảo sát giữa HK1 2026–2027 | open | /admin/campaigns/cmw3xodyd0160qgzs1avxvoye/report |
| Cơ khí · Bản nháp khảo sát HK1 | draft | /admin/campaigns/cmw3xoe6g01aeqgzsxa6pi730/review |
| Cơ khí · Đợt đã hủy để thử bộ lọc | cancelled | /admin/campaigns/cmw3xoimh043lqgzsqtagw3dn/report |

## Khoa Điện Điện tử (DDT)

### Giảng viên và Trưởng khoa

| Mã | Họ tên | Vai trò | Email đăng nhập | Mật khẩu |
|---|---|---|---|---|
| GV-DDT-1 | Hồ Minh Quân | Trưởng khoa + Giảng viên | tk.ddt@demo.vn | vitrung65 |
| GV-DDT-2 | Ngô Thành Đạt | Giảng viên | gv.ddt2@demo.vn | vitrung65 |
| GV-DDT-3 | Dương Thị Hạnh | Giảng viên | gv.ddt3@demo.vn | vitrung65 |
| GV-DDT-4 | Lý Văn Long | Giảng viên | gv.ddt4@demo.vn | vitrung65 |

### DDT25-CQ — Chính quy

Điện Điện tử khóa 2025 · Chính quy. 5 sinh viên, 4 môn mỗi học kỳ.

| MSSV | Họ tên | Email đăng nhập | Mật khẩu |
|---|---|---|---|
| 25DDT01 | Lê Minh Nhật | sv.ddt01@demo.vn | vitrung65 |
| 25DDT02 | Lê Văn Sang | sv.ddt02@demo.vn | vitrung65 |
| 25DDT03 | Lê Thảo Nguyên | sv.ddt03@demo.vn | vitrung65 |
| 25DDT04 | Lê Hoàng Nam | sv.ddt04@demo.vn | vitrung65 |
| 25DDT05 | Lê Ngọc Anh | sv.ddt05@demo.vn | vitrung65 |

| Học kỳ | Mã môn | Môn học | Lớp học phần | Giảng viên thực dạy |
|---|---|---|---|---|
| Học kỳ 2 · 2025–2026 | DDT101 | Mạch điện | DDT101-1-HK2 | Hồ Minh Quân (tk.ddt@demo.vn) |
| Học kỳ 2 · 2025–2026 | DDT102 | Điện tử cơ bản | DDT102-1-HK2 | Ngô Thành Đạt (gv.ddt2@demo.vn) |
| Học kỳ 2 · 2025–2026 | DDT103 | Kỹ thuật số | DDT103-1-HK2 | Dương Thị Hạnh (gv.ddt3@demo.vn) |
| Học kỳ 2 · 2025–2026 | DDT104 | Máy điện | DDT104-1-HK2 | Lý Văn Long (gv.ddt4@demo.vn) |
| Học kỳ 1 · 2026–2027 | DDT105 | Đo lường điện | DDT105-1-HK1 | Ngô Thành Đạt (gv.ddt2@demo.vn) |
| Học kỳ 1 · 2026–2027 | DDT106 | Điện tử công suất | DDT106-1-HK1 | Dương Thị Hạnh (gv.ddt3@demo.vn) |
| Học kỳ 1 · 2026–2027 | DDT107 | Vi điều khiển | DDT107-1-HK1 | Lý Văn Long (gv.ddt4@demo.vn) |
| Học kỳ 1 · 2026–2027 | DDT108 | Điều khiển tự động | DDT108-1-HK1 | Hồ Minh Quân (tk.ddt@demo.vn) |

### DDT25-VLVH — Vừa học vừa làm

Điện Điện tử khóa 2025 · Vừa học vừa làm. 5 sinh viên, 4 môn mỗi học kỳ.

| MSSV | Họ tên | Email đăng nhập | Mật khẩu |
|---|---|---|---|
| 25DDT06 | Lê Gia Hân | sv.ddt06@demo.vn | vitrung65 |
| 25DDT07 | Lê Đức Minh | sv.ddt07@demo.vn | vitrung65 |
| 25DDT08 | Lê Thanh Trúc | sv.ddt08@demo.vn | vitrung65 |
| 25DDT09 | Lê Quốc Huy | sv.ddt09@demo.vn | vitrung65 |
| 25DDT10 | Lê Phương Linh | sv.ddt10@demo.vn | vitrung65 |

| Học kỳ | Mã môn | Môn học | Lớp học phần | Giảng viên thực dạy |
|---|---|---|---|---|
| Học kỳ 2 · 2025–2026 | DDT101 | Mạch điện | DDT101-2-HK2 | Ngô Thành Đạt (gv.ddt2@demo.vn) |
| Học kỳ 2 · 2025–2026 | DDT102 | Điện tử cơ bản | DDT102-2-HK2 | Dương Thị Hạnh (gv.ddt3@demo.vn) |
| Học kỳ 2 · 2025–2026 | DDT103 | Kỹ thuật số | DDT103-2-HK2 | Lý Văn Long (gv.ddt4@demo.vn) |
| Học kỳ 2 · 2025–2026 | DDT104 | Máy điện | DDT104-2-HK2 | Hồ Minh Quân (tk.ddt@demo.vn) |
| Học kỳ 1 · 2026–2027 | DDT105 | Đo lường điện | DDT105-2-HK1 | Dương Thị Hạnh (gv.ddt3@demo.vn) |
| Học kỳ 1 · 2026–2027 | DDT106 | Điện tử công suất | DDT106-2-HK1 | Lý Văn Long (gv.ddt4@demo.vn) |
| Học kỳ 1 · 2026–2027 | DDT107 | Vi điều khiển | DDT107-2-HK1 | Hồ Minh Quân (tk.ddt@demo.vn) |
| Học kỳ 1 · 2026–2027 | DDT108 | Điều khiển tự động | DDT108-2-HK1 | Ngô Thành Đạt (gv.ddt2@demo.vn) |

### DDT25-TX — Đào tạo từ xa

Điện Điện tử khóa 2025 · Đào tạo từ xa. 5 sinh viên, 4 môn mỗi học kỳ.

| MSSV | Họ tên | Email đăng nhập | Mật khẩu |
|---|---|---|---|
| 25DDT11 | Lê Minh Khang | sv.ddt11@demo.vn | vitrung65 |
| 25DDT12 | Lê Bảo Ngọc | sv.ddt12@demo.vn | vitrung65 |
| 25DDT13 | Lê Tuấn Kiệt | sv.ddt13@demo.vn | vitrung65 |
| 25DDT14 | Lê Khánh Linh | sv.ddt14@demo.vn | vitrung65 |
| 25DDT15 | Lê Hải Đăng | sv.ddt15@demo.vn | vitrung65 |

| Học kỳ | Mã môn | Môn học | Lớp học phần | Giảng viên thực dạy |
|---|---|---|---|---|
| Học kỳ 2 · 2025–2026 | DDT101 | Mạch điện | DDT101-3-HK2 | Dương Thị Hạnh (gv.ddt3@demo.vn) |
| Học kỳ 2 · 2025–2026 | DDT102 | Điện tử cơ bản | DDT102-3-HK2 | Lý Văn Long (gv.ddt4@demo.vn) |
| Học kỳ 2 · 2025–2026 | DDT103 | Kỹ thuật số | DDT103-3-HK2 | Hồ Minh Quân (tk.ddt@demo.vn) |
| Học kỳ 2 · 2025–2026 | DDT104 | Máy điện | DDT104-3-HK2 | Ngô Thành Đạt (gv.ddt2@demo.vn) |
| Học kỳ 1 · 2026–2027 | DDT105 | Đo lường điện | DDT105-3-HK1 | Lý Văn Long (gv.ddt4@demo.vn) |
| Học kỳ 1 · 2026–2027 | DDT106 | Điện tử công suất | DDT106-3-HK1 | Hồ Minh Quân (tk.ddt@demo.vn) |
| Học kỳ 1 · 2026–2027 | DDT107 | Vi điều khiển | DDT107-3-HK1 | Ngô Thành Đạt (gv.ddt2@demo.vn) |
| Học kỳ 1 · 2026–2027 | DDT108 | Điều khiển tự động | DDT108-3-HK1 | Dương Thị Hạnh (gv.ddt3@demo.vn) |

### Đợt khảo sát của khoa

| Tên đợt | Trạng thái mẫu | Trang quản trị |
|---|---|---|
| Điện Điện tử · Kết quả HK2 2025–2026 | closed | /admin/campaigns/cmw3xoe6l01aiqgzs1pbcf9do/report |
| Điện Điện tử · Khảo sát giữa HK1 2026–2027 | open | /admin/campaigns/cmw3xofb201sgqgzsn656eb3z/report |
| Điện Điện tử · Bản nháp khảo sát HK1 | draft | /admin/campaigns/cmw3xofgt01wuqgzsk1kuggvy/review |

## Khoa Kinh tế (KT)

### Giảng viên và Trưởng khoa

| Mã | Họ tên | Vai trò | Email đăng nhập | Mật khẩu |
|---|---|---|---|---|
| GV-KT-1 | Nguyễn Thị Thu | Trưởng khoa + Giảng viên | tk.kt@demo.vn | vitrung65 |
| GV-KT-2 | Trần Đức Huy | Giảng viên | gv.kt2@demo.vn | vitrung65 |
| GV-KT-3 | Lê Thị Ngọc | Giảng viên | gv.kt3@demo.vn | vitrung65 |
| GV-KT-4 | Phạm Quốc Việt | Giảng viên | gv.kt4@demo.vn | vitrung65 |

### KT25-CQ — Chính quy

Kinh tế khóa 2025 · Chính quy. 5 sinh viên, 4 môn mỗi học kỳ.

| MSSV | Họ tên | Email đăng nhập | Mật khẩu |
|---|---|---|---|
| 25KT01 | Phạm Minh Nhật | sv.kt01@demo.vn | vitrung65 |
| 25KT02 | Phạm Văn Sang | sv.kt02@demo.vn | vitrung65 |
| 25KT03 | Phạm Thảo Nguyên | sv.kt03@demo.vn | vitrung65 |
| 25KT04 | Phạm Hoàng Nam | sv.kt04@demo.vn | vitrung65 |
| 25KT05 | Phạm Ngọc Anh | sv.kt05@demo.vn | vitrung65 |

| Học kỳ | Mã môn | Môn học | Lớp học phần | Giảng viên thực dạy |
|---|---|---|---|---|
| Học kỳ 2 · 2025–2026 | KT101 | Kinh tế vi mô | KT101-1-HK2 | Nguyễn Thị Thu (tk.kt@demo.vn) |
| Học kỳ 2 · 2025–2026 | KT102 | Kinh tế vĩ mô | KT102-1-HK2 | Trần Đức Huy (gv.kt2@demo.vn) |
| Học kỳ 2 · 2025–2026 | KT103 | Nguyên lý kế toán | KT103-1-HK2 | Lê Thị Ngọc (gv.kt3@demo.vn) |
| Học kỳ 2 · 2025–2026 | KT104 | Quản trị học | KT104-1-HK2 | Phạm Quốc Việt (gv.kt4@demo.vn) |
| Học kỳ 1 · 2026–2027 | KT105 | Marketing căn bản | KT105-1-HK1 | Trần Đức Huy (gv.kt2@demo.vn) |
| Học kỳ 1 · 2026–2027 | KT106 | Tài chính doanh nghiệp | KT106-1-HK1 | Lê Thị Ngọc (gv.kt3@demo.vn) |
| Học kỳ 1 · 2026–2027 | KT107 | Quản trị nhân lực | KT107-1-HK1 | Phạm Quốc Việt (gv.kt4@demo.vn) |
| Học kỳ 1 · 2026–2027 | KT108 | Thống kê kinh doanh | KT108-1-HK1 | Nguyễn Thị Thu (tk.kt@demo.vn) |

### KT25-VLVH — Vừa học vừa làm

Kinh tế khóa 2025 · Vừa học vừa làm. 5 sinh viên, 4 môn mỗi học kỳ.

| MSSV | Họ tên | Email đăng nhập | Mật khẩu |
|---|---|---|---|
| 25KT06 | Phạm Gia Hân | sv.kt06@demo.vn | vitrung65 |
| 25KT07 | Phạm Đức Minh | sv.kt07@demo.vn | vitrung65 |
| 25KT08 | Phạm Thanh Trúc | sv.kt08@demo.vn | vitrung65 |
| 25KT09 | Phạm Quốc Huy | sv.kt09@demo.vn | vitrung65 |
| 25KT10 | Phạm Phương Linh | sv.kt10@demo.vn | vitrung65 |

| Học kỳ | Mã môn | Môn học | Lớp học phần | Giảng viên thực dạy |
|---|---|---|---|---|
| Học kỳ 2 · 2025–2026 | KT101 | Kinh tế vi mô | KT101-2-HK2 | Trần Đức Huy (gv.kt2@demo.vn) |
| Học kỳ 2 · 2025–2026 | KT102 | Kinh tế vĩ mô | KT102-2-HK2 | Lê Thị Ngọc (gv.kt3@demo.vn) |
| Học kỳ 2 · 2025–2026 | KT103 | Nguyên lý kế toán | KT103-2-HK2 | Phạm Quốc Việt (gv.kt4@demo.vn) |
| Học kỳ 2 · 2025–2026 | KT104 | Quản trị học | KT104-2-HK2 | Nguyễn Thị Thu (tk.kt@demo.vn) |
| Học kỳ 1 · 2026–2027 | KT105 | Marketing căn bản | KT105-2-HK1 | Lê Thị Ngọc (gv.kt3@demo.vn) |
| Học kỳ 1 · 2026–2027 | KT106 | Tài chính doanh nghiệp | KT106-2-HK1 | Phạm Quốc Việt (gv.kt4@demo.vn) |
| Học kỳ 1 · 2026–2027 | KT107 | Quản trị nhân lực | KT107-2-HK1 | Nguyễn Thị Thu (tk.kt@demo.vn) |
| Học kỳ 1 · 2026–2027 | KT108 | Thống kê kinh doanh | KT108-2-HK1 | Trần Đức Huy (gv.kt2@demo.vn) |

### KT25-TX — Đào tạo từ xa

Kinh tế khóa 2025 · Đào tạo từ xa. 5 sinh viên, 4 môn mỗi học kỳ.

| MSSV | Họ tên | Email đăng nhập | Mật khẩu |
|---|---|---|---|
| 25KT11 | Phạm Minh Khang | sv.kt11@demo.vn | vitrung65 |
| 25KT12 | Phạm Bảo Ngọc | sv.kt12@demo.vn | vitrung65 |
| 25KT13 | Phạm Tuấn Kiệt | sv.kt13@demo.vn | vitrung65 |
| 25KT14 | Phạm Khánh Linh | sv.kt14@demo.vn | vitrung65 |
| 25KT15 | Phạm Hải Đăng | sv.kt15@demo.vn | vitrung65 |

| Học kỳ | Mã môn | Môn học | Lớp học phần | Giảng viên thực dạy |
|---|---|---|---|---|
| Học kỳ 2 · 2025–2026 | KT101 | Kinh tế vi mô | KT101-3-HK2 | Lê Thị Ngọc (gv.kt3@demo.vn) |
| Học kỳ 2 · 2025–2026 | KT102 | Kinh tế vĩ mô | KT102-3-HK2 | Phạm Quốc Việt (gv.kt4@demo.vn) |
| Học kỳ 2 · 2025–2026 | KT103 | Nguyên lý kế toán | KT103-3-HK2 | Nguyễn Thị Thu (tk.kt@demo.vn) |
| Học kỳ 2 · 2025–2026 | KT104 | Quản trị học | KT104-3-HK2 | Trần Đức Huy (gv.kt2@demo.vn) |
| Học kỳ 1 · 2026–2027 | KT105 | Marketing căn bản | KT105-3-HK1 | Phạm Quốc Việt (gv.kt4@demo.vn) |
| Học kỳ 1 · 2026–2027 | KT106 | Tài chính doanh nghiệp | KT106-3-HK1 | Nguyễn Thị Thu (tk.kt@demo.vn) |
| Học kỳ 1 · 2026–2027 | KT107 | Quản trị nhân lực | KT107-3-HK1 | Trần Đức Huy (gv.kt2@demo.vn) |
| Học kỳ 1 · 2026–2027 | KT108 | Thống kê kinh doanh | KT108-3-HK1 | Lê Thị Ngọc (gv.kt3@demo.vn) |

### Đợt khảo sát của khoa

| Tên đợt | Trạng thái mẫu | Trang quản trị |
|---|---|---|
| Kinh tế · Kết quả HK2 2025–2026 | closed | /admin/campaigns/cmw3xofgx01wyqgzsl5ef5mmj/report |
| Kinh tế · Khảo sát giữa HK1 2026–2027 | open | /admin/campaigns/cmw3xofpv02ewqgzsbeogax78/report |
| Kinh tế · Bản nháp khảo sát HK1 | draft | /admin/campaigns/cmw3xofs902jaqgzshtfl59p8/review |

## Khoa Ngoại ngữ (NN)

### Giảng viên và Trưởng khoa

| Mã | Họ tên | Vai trò | Email đăng nhập | Mật khẩu |
|---|---|---|---|---|
| GV-NN-1 | Võ Thị Ánh | Trưởng khoa + Giảng viên | tk.nn@demo.vn | vitrung65 |
| GV-NN-2 | Đặng Minh Khoa | Giảng viên | gv.nn2@demo.vn | vitrung65 |
| GV-NN-3 | Bùi Thanh Sơn | Giảng viên | gv.nn3@demo.vn | vitrung65 |
| GV-NN-4 | Đỗ Ngọc Yến | Giảng viên | gv.nn4@demo.vn | vitrung65 |

### NN25-CQ — Chính quy

Ngoại ngữ khóa 2025 · Chính quy. 5 sinh viên, 4 môn mỗi học kỳ.

| MSSV | Họ tên | Email đăng nhập | Mật khẩu |
|---|---|---|---|
| 25NN01 | Võ Minh Nhật | sv.nn01@demo.vn | vitrung65 |
| 25NN02 | Võ Văn Sang | sv.nn02@demo.vn | vitrung65 |
| 25NN03 | Võ Thảo Nguyên | sv.nn03@demo.vn | vitrung65 |
| 25NN04 | Võ Hoàng Nam | sv.nn04@demo.vn | vitrung65 |
| 25NN05 | Võ Ngọc Anh | sv.nn05@demo.vn | vitrung65 |

| Học kỳ | Mã môn | Môn học | Lớp học phần | Giảng viên thực dạy |
|---|---|---|---|---|
| Học kỳ 2 · 2025–2026 | NN101 | Ngữ âm tiếng Anh | NN101-1-HK2 | Võ Thị Ánh (tk.nn@demo.vn) |
| Học kỳ 2 · 2025–2026 | NN102 | Ngữ pháp tiếng Anh | NN102-1-HK2 | Đặng Minh Khoa (gv.nn2@demo.vn) |
| Học kỳ 2 · 2025–2026 | NN103 | Nghe hiểu | NN103-1-HK2 | Bùi Thanh Sơn (gv.nn3@demo.vn) |
| Học kỳ 2 · 2025–2026 | NN104 | Nói tiếng Anh | NN104-1-HK2 | Đỗ Ngọc Yến (gv.nn4@demo.vn) |
| Học kỳ 1 · 2026–2027 | NN105 | Đọc hiểu | NN105-1-HK1 | Đặng Minh Khoa (gv.nn2@demo.vn) |
| Học kỳ 1 · 2026–2027 | NN106 | Viết học thuật | NN106-1-HK1 | Bùi Thanh Sơn (gv.nn3@demo.vn) |
| Học kỳ 1 · 2026–2027 | NN107 | Biên dịch | NN107-1-HK1 | Đỗ Ngọc Yến (gv.nn4@demo.vn) |
| Học kỳ 1 · 2026–2027 | NN108 | Phiên dịch | NN108-1-HK1 | Võ Thị Ánh (tk.nn@demo.vn) |

### NN25-VLVH — Vừa học vừa làm

Ngoại ngữ khóa 2025 · Vừa học vừa làm. 5 sinh viên, 4 môn mỗi học kỳ.

| MSSV | Họ tên | Email đăng nhập | Mật khẩu |
|---|---|---|---|
| 25NN06 | Võ Gia Hân | sv.nn06@demo.vn | vitrung65 |
| 25NN07 | Võ Đức Minh | sv.nn07@demo.vn | vitrung65 |
| 25NN08 | Võ Thanh Trúc | sv.nn08@demo.vn | vitrung65 |
| 25NN09 | Võ Quốc Huy | sv.nn09@demo.vn | vitrung65 |
| 25NN10 | Võ Phương Linh | sv.nn10@demo.vn | vitrung65 |

| Học kỳ | Mã môn | Môn học | Lớp học phần | Giảng viên thực dạy |
|---|---|---|---|---|
| Học kỳ 2 · 2025–2026 | NN101 | Ngữ âm tiếng Anh | NN101-2-HK2 | Đặng Minh Khoa (gv.nn2@demo.vn) |
| Học kỳ 2 · 2025–2026 | NN102 | Ngữ pháp tiếng Anh | NN102-2-HK2 | Bùi Thanh Sơn (gv.nn3@demo.vn) |
| Học kỳ 2 · 2025–2026 | NN103 | Nghe hiểu | NN103-2-HK2 | Đỗ Ngọc Yến (gv.nn4@demo.vn) |
| Học kỳ 2 · 2025–2026 | NN104 | Nói tiếng Anh | NN104-2-HK2 | Võ Thị Ánh (tk.nn@demo.vn) |
| Học kỳ 1 · 2026–2027 | NN105 | Đọc hiểu | NN105-2-HK1 | Bùi Thanh Sơn (gv.nn3@demo.vn) |
| Học kỳ 1 · 2026–2027 | NN106 | Viết học thuật | NN106-2-HK1 | Đỗ Ngọc Yến (gv.nn4@demo.vn) |
| Học kỳ 1 · 2026–2027 | NN107 | Biên dịch | NN107-2-HK1 | Võ Thị Ánh (tk.nn@demo.vn) |
| Học kỳ 1 · 2026–2027 | NN108 | Phiên dịch | NN108-2-HK1 | Đặng Minh Khoa (gv.nn2@demo.vn) |

### NN25-TX — Đào tạo từ xa

Ngoại ngữ khóa 2025 · Đào tạo từ xa. 5 sinh viên, 4 môn mỗi học kỳ.

| MSSV | Họ tên | Email đăng nhập | Mật khẩu |
|---|---|---|---|
| 25NN11 | Võ Minh Khang | sv.nn11@demo.vn | vitrung65 |
| 25NN12 | Võ Bảo Ngọc | sv.nn12@demo.vn | vitrung65 |
| 25NN13 | Võ Tuấn Kiệt | sv.nn13@demo.vn | vitrung65 |
| 25NN14 | Võ Khánh Linh | sv.nn14@demo.vn | vitrung65 |
| 25NN15 | Võ Hải Đăng | sv.nn15@demo.vn | vitrung65 |

| Học kỳ | Mã môn | Môn học | Lớp học phần | Giảng viên thực dạy |
|---|---|---|---|---|
| Học kỳ 2 · 2025–2026 | NN101 | Ngữ âm tiếng Anh | NN101-3-HK2 | Bùi Thanh Sơn (gv.nn3@demo.vn) |
| Học kỳ 2 · 2025–2026 | NN102 | Ngữ pháp tiếng Anh | NN102-3-HK2 | Đỗ Ngọc Yến (gv.nn4@demo.vn) |
| Học kỳ 2 · 2025–2026 | NN103 | Nghe hiểu | NN103-3-HK2 | Võ Thị Ánh (tk.nn@demo.vn) |
| Học kỳ 2 · 2025–2026 | NN104 | Nói tiếng Anh | NN104-3-HK2 | Đặng Minh Khoa (gv.nn2@demo.vn) |
| Học kỳ 1 · 2026–2027 | NN105 | Đọc hiểu | NN105-3-HK1 | Đỗ Ngọc Yến (gv.nn4@demo.vn) |
| Học kỳ 1 · 2026–2027 | NN106 | Viết học thuật | NN106-3-HK1 | Võ Thị Ánh (tk.nn@demo.vn) |
| Học kỳ 1 · 2026–2027 | NN107 | Biên dịch | NN107-3-HK1 | Đặng Minh Khoa (gv.nn2@demo.vn) |
| Học kỳ 1 · 2026–2027 | NN108 | Phiên dịch | NN108-3-HK1 | Bùi Thanh Sơn (gv.nn3@demo.vn) |

### Đợt khảo sát của khoa

| Tên đợt | Trạng thái mẫu | Trang quản trị |
|---|---|---|
| Ngoại ngữ · Kết quả HK2 2025–2026 | closed | /admin/campaigns/cmw3xofsd02jeqgzsd2pd0k3e/report |
| Ngoại ngữ · Khảo sát giữa HK1 2026–2027 | open | /admin/campaigns/cmw3xoghr031cqgzswn8enfk7/report |
| Ngoại ngữ · Bản nháp khảo sát HK1 | draft | /admin/campaigns/cmw3xoh9r035qqgzst2slo9im/review |

## Hai trường hợp học khác phân công

| Sinh viên | Email | Học kỳ | Môn học | Giảng viên riêng | Lớp học phần riêng |
|---|---|---|---|---|---|
| Nguyễn Ngọc Anh | sv.cntt05@demo.vn | Học kỳ 1 · 2026–2027 | Mạng máy tính | Nguyễn Minh Anh | CNTT105-1-HK1-R |
| Trần Phương Linh | sv.ck10@demo.vn | Học kỳ 1 · 2026–2027 | Công nghệ chế tạo máy | Võ Thanh Tùng | CK106-2-HK1-R |

Hai sinh viên này vẫn học 4 môn, chỉ đổi nhóm và giảng viên của một môn ở HK1. Dùng quản lý học vụ của sinh viên để thử khôi phục phân công chung.

File này công khai mật khẩu của tài khoản demo. Không dùng các mật khẩu này cho Admin hoặc tài khoản thật.
