# Hệ thống khảo sát và phản hồi sinh viên

Ứng dụng khảo sát sinh viên đang được phát triển theo [phương án kỹ thuật](docs/PHUONG_AN_KY_THUAT_MVP.md). Các luồng trình dựng, học vụ, hồ sơ và thông báo có nghiệm thu Playwright với dữ liệu MySQL riêng. Xem [kết quả rà soát và phần còn thiếu](docs/RA_SOAT_HOAN_THIEN_2026-11-09.md) để phân biệt phần đã hoàn thành và phần chưa triển khai.

## Chạy local trên Windows

Yêu cầu: Node.js 22.13 trở lên (khuyến nghị Node.js 24), pnpm và MySQL Server 8.0 trở lên cài trực tiếp trên Windows. MySQL Workbench là công cụ quản lý tùy chọn.

Kiểm tra dịch vụ MySQL đã chạy trong PowerShell:

```powershell
Get-Service MySQL80
```

Trạng thái cần là `Running`. Nếu đang dừng, mở Services của Windows và Start dịch vụ `MySQL80`.

Khởi tạo cấu hình trong thư mục dự án (chỉ sao chép khi chưa có `.env`):

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

Trong `.env`:

- Thay `YOUR_URL_ENCODED_MYSQL_PASSWORD` bằng mật khẩu `root` đã đặt khi cài MySQL. Mã hóa phần mật khẩu theo URL nếu có ký tự đặc biệt: ví dụ `@` thành `%40`, `#` thành `%23`, `%` thành `%25`.
- Thay `AUTH_SECRET` bằng chuỗi ngẫu nhiên tối thiểu 32 ký tự. Có thể tạo bằng `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` rồi chép kết quả vào `.env`.
- Không gửi mật khẩu hoặc file `.env` lên Git. Tài khoản `root` chỉ dùng cho bước phát triển local; khi triển khai cần cấp tài khoản riêng cho ứng dụng.

Tạo cơ sở dữ liệu bằng MySQL Workbench hoặc MySQL Command Line Client sau khi đăng nhập `root`:

```sql
CREATE DATABASE IF NOT EXISTS student_survey
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Cài thư viện, áp dụng migration và kiểm tra kết nối:

```powershell
pnpm install
pnpm exec prisma generate
pnpm db:migrate
pnpm db:check
```

Khởi động trang web ở `http://localhost:3005`:

```powershell
pnpm dev -- --port 3005
```

Tạo dữ liệu mẫu **chỉ trên cơ sở dữ liệu thử nghiệm trống**. Lệnh seed xóa dữ liệu nghiệp vụ hiện có trước khi tạo lại; không chạy trên dữ liệu cần giữ.

`pnpm db:seed` tự nạp `DATABASE_URL` từ file `.env` ở thư mục gốc dự án. `SEED_PASSWORD` được đặt trong terminal hiện tại; biến môi trường của terminal được ưu tiên hơn giá trị trong `.env`.

Nếu terminal là Command Prompt (CMD, dấu nhắc dạng `C:\KhaoSatSinhVien>`), dùng:

```cmd
set "SEED_PASSWORD=THAY_BANG_MAT_KHAU_TOI_THIEU_8_KY_TU"
pnpm db:seed
set "SEED_PASSWORD="
pnpm dev -- --port 3005
```

Nếu dùng PowerShell 7, dùng:

```powershell
$env:SEED_PASSWORD = Read-Host -AsSecureString | ConvertFrom-SecureString -AsPlainText
pnpm db:seed
Remove-Item Env:SEED_PASSWORD
pnpm dev -- --port 3005
```

Mở `http://localhost:3005`. Dữ liệu seed tạo các tài khoản `admin@demo.vn`, `giangvien@demo.vn` và `sinhvien1@demo.vn` đến `sinhvien5@demo.vn`; tất cả dùng mật khẩu đã nhập qua `SEED_PASSWORD`. Mật khẩu không được lưu trong Git.

Những lần sau, khi dịch vụ `MySQL80` đang chạy, dùng `pnpm dev -- --port 3005`. Giữ terminal mở và nhấn `Ctrl+C` để dừng website. Không cần Docker khi chạy local trực tiếp.

## Đưa ứng dụng lên server bằng Docker

Server cần Git, Docker Engine và Docker Compose plugin đã cài. Các lệnh bên dưới chạy trong terminal Linux của server. Không đưa file `.env` lên GitHub hoặc chép nó vào image Docker.

1. Tải dự án và tạo file cấu hình bí mật:

```bash
git clone https://github.com/phamminhnhat2k3/KhaoSatSinhVien.git
cd KhaoSatSinhVien
cp .env.example .env
openssl rand -hex 32
openssl rand -hex 24
openssl rand -hex 24
```

2. Mở `.env` bằng `nano .env`. Thay các giá trị `CHANGE_THIS...` và `REPLACE...` bằng các chuỗi vừa tạo, theo thứ tự: mật khẩu MySQL root, mật khẩu MySQL của ứng dụng, rồi `AUTH_SECRET`. Dùng mật khẩu ứng dụng đó thay `YOUR_URL_ENCODED_MYSQL_PASSWORD` trong `DATABASE_URL_DOCKER`. Không dùng mật khẩu MySQL root cho ứng dụng. Mật khẩu hex do `openssl rand -hex` tạo không cần mã hóa ký tự URL.

3. Nếu triển khai qua tên miền, sửa `APP_URL` thành địa chỉ HTTPS thực tế, ví dụ `https://khaosat.example.edu.vn`. Không để mật khẩu, `AUTH_SECRET` hoặc thông tin Gmail trong lệnh terminal hay tài liệu công khai.

4. Build và khởi chạy:

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 migrate app
```

Lần đầu, Compose tạo MySQL kèm vùng lưu dữ liệu bền vững, đợi database sẵn sàng, áp dụng migration rồi mới khởi động web. Mở `http://IP-SERVER:3005`. Để dùng HTTPS với tên miền, đặt reverse proxy phía trước ứng dụng và cho proxy chuyển tiếp đến cổng `3005`.

5. Khi cập nhật phiên bản sau này:

```bash
git pull
docker compose up -d --build
docker compose ps
```

MySQL được lưu trong volume `mysql_data`; không xóa volume nếu cần giữ dữ liệu. Có thể xem lỗi khởi động bằng `docker compose logs -f app migrate db`. File `.env` và dữ liệu MySQL không nằm trong Git hoặc image.


## Chức năng chính

- [Thu hồi phiên khi đổi mật khẩu và quên mật khẩu qua Gmail](docs/MAT_KHAU_VA_GMAIL.md): link 15 phút, dùng một lần, chỉ lưu băm token. Cần cấu hình Gmail và APP_URL trên máy chủ để gửi thư thật.

- Có [báo cáo PDF/XLSX chuẩn, nhập Excel trực tiếp và nhắc hạn tự động trong web](docs/BAO_CAO_EXCEL_NHAC_HAN.md). Máy chủ kiểm tra mỗi 15 phút khi đang hoạt động, nhắc đợt còn tối đa 3 ngày. Nút nhắc tay vẫn giữ, tránh nhắc lặp cùng sinh viên trong 24 giờ. Luồng đổi mật khẩu hiện tại không thay đổi.

- Nhập sinh viên, giảng viên và phân công bằng CSV UTF-8 có xem trước, kiểm tra từng dòng và ghi toàn bộ trong giao dịch. Nhắc sinh viên chưa hoàn thành trong web. Đối chiếu giảng viên cùng môn, đối chiếu học kỳ có điều kiện, ghi nhận hướng cải thiện và gửi nhận xét cho Admin. Admin in/lưu PDF để gửi nhà trường. Xem [quy tắc và hướng dẫn khai thác kết quả](docs/KHAI_THAC_KET_QUA.md).

- Auth.js Credentials, mật khẩu Argon2id và phân quyền máy chủ theo `STUDENT`, `LECTURER`, `DEAN`, `ADMIN`.
- Quản trị có trang riêng cho mẫu, đợt, lớp và sinh viên. Trình dựng mẫu hỗ trợ kéo thả, nhân bản, đổi thứ tự bằng bàn phím, bắt buộc/tùy chọn, xem trước; lựa chọn tự nhập và thang số nguyên từ 0 đến 1.000 với bước nhảy tùy chỉnh. Mẫu đã dùng được bảo toàn bằng phiên bản mới khi chỉnh sửa. Mẫu chưa dùng có thể sửa hoặc xóa.
- Tạo đợt theo khoa hoặc toàn trường, gắn học kỳ và mẫu câu hỏi chung. Đợt khoa có thể kèm mẫu đánh giá môn; mỗi sinh viên chỉ nhận các môn thực học trong học kỳ thuộc phạm vi đã chọn. Người nhận và phần môn được chốt khi công bố, không phải khi tạo nháp.
- `/admin/academic`: tạo khoa, lớp hành chính và học kỳ. Lớp hành chính quản lý sinh viên theo khoa; lớp học phần là lớp đăng ký môn với giảng viên trong một học kỳ.
- `/admin/users`: danh sách người dùng có tìm tên/mã/email, lọc vai trò/khoa/lớp/trạng thái và phân trang. Có sửa nghiệp vụ, khóa, mở khóa và xóa có kiểm tra liên quan. Hồ sơ học vụ cho phép phân lớp và bổ sung ghi danh đúng khoa, hệ học và học kỳ. Mỗi môn trong học kỳ chỉ chọn một lớp học phần, trường hợp học khác dùng Điều chỉnh môn học riêng.
- Admin bấm tên khảo sát hoặc “Xem bài đánh giá” để mở danh sách phiếu đã nộp và xem từng câu trả lời ngay khi có phiếu gửi. Phiếu không gắn tên/mã sinh viên; quyền này chỉ dành cho admin, không thay đổi điều kiện mở báo cáo tổng hợp của giảng viên.
- Sinh viên chỉ thấy khảo sát được giao, có thể lưu nháp và chỉ gửi một lần.
- `/dean/people`: Trưởng khoa tra cứu giảng viên và sinh viên trong khoa qua popup Thông tin / Đánh giá, chỉ đọc. Số phiếu sinh viên chỉ tính các đợt thuộc khoa, không nối danh tính với nội dung bài nộp.
- `/admin/assignments`: phân công chung theo lớp hành chính và học kỳ, hỗ trợ danh sách riêng cho sinh viên học khác. Lớp có hệ Chính quy, Vừa học vừa làm hoặc Đào tạo từ xa.
- Transaction đồng thời tạo phản hồi và ghi nhận hoàn thành; `Submission` không chứa khóa định danh sinh viên.
- Báo cáo theo phạm vi giảng dạy, chỉ mở sau khi đóng và đủ `MIN_REPORT_RESPONSES` cho từng môn; hỗ trợ CSV với số người được giao và số phiếu thực tế của từng phần. Giảng viên không được xem phần chung của khoa/toàn trường qua báo cáo môn.
- Giao diện tiếng Việt, responsive và dữ liệu seed cho nghiệm thu.
- `/profile`: hồ sơ cá nhân cho cả bốn vai trò, thông tin nghiệp vụ chỉ đọc, chỉnh họ tên/liên hệ/đơn vị/giới thiệu/màu bìa và đổi mật khẩu có xác thực mật khẩu cũ. Có tải và căn chỉnh ảnh đại diện. Đổi hoặc đặt lại mật khẩu vô hiệu hóa các phiên đăng nhập cũ.
- Thông báo nhanh trong bảng trượt bên phải, có phân trang và đánh dấu đọc. Thông báo trong ứng dụng khi công bố/đóng đợt (sinh viên được mời, giảng viên phụ trách và admin thực hiện), hoặc khi tự đổi mật khẩu. Có bộ lọc, phân trang, đánh dấu đọc theo chủ sở hữu và số chưa đọc tự cập nhật mỗi 30 giây khi trang đang hiển thị. Chưa gửi email/push.

Sau khi cập nhật mã nguồn local, dừng dev server rồi chạy `pnpm db:migrate` và `pnpm exec prisma generate` trước khi `pnpm dev -- --port 3005`. Các migration mới bổ sung cột/bảng và mở rộng độ dài nội dung, không cần chạy lại seed. Ngày khảo sát được hiểu theo giờ Việt Nam, bao gồm trọn ngày kết thúc.

Xem [hướng dẫn khảo sát theo khoa/toàn trường](docs/KHAO_SAT_THEO_PHAM_VI.md). Sinh viên cũ chưa có lớp hành chính cần được phân lớp trong danh sách sinh viên trước khi nhận đợt khoa; đợt khảo sát cũ và các phản hồi vẫn giữ nguyên. Trường `department` tự nhập trong hồ sơ không quyết định khoa.

## Kiểm tra chất lượng

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
pnpm test:e2e
```

Nghiệm thu nghiệp vụ dùng `pnpm test:e2e:isolated`: tạo database tạm, tự tạo dữ liệu kiểm thử và dọn sau khi chạy; không cần seed hay mật khẩu demo. Ba hành trình admin/sinh viên/giảng viên đã chuyển sang dữ liệu riêng và được chạy trong bộ này. Cài Chromium bằng `pnpm exec playwright install chromium` nếu máy chưa có.

Các bài nghiệm thu mới không cần seed hoặc mật khẩu demo. Chúng tạo tài khoản, học vụ và khảo sát có mã riêng rồi dọn đúng các bản ghi đã tạo khi kết thúc. Với CMD:

```cmd
set "RUN_FEATURE_E2E=1"
pnpm test:e2e -- tests/e2e/builder.spec.ts tests/e2e/roles.spec.ts tests/e2e/academic.spec.ts
set "RUN_FEATURE_E2E="
```

Cần MySQL đã áp dụng migration và `.env` hợp lệ. Không tắt tiến trình giữa chừng để bước dọn dữ liệu được thực hiện. Ảnh nghiệm thu được lưu trong `.playwright-cli/` (không đưa vào Git).

Nghiệm thu đầy đủ mô hình khoa/toàn trường dùng database MySQL riêng, không gửi phiếu/thông báo thử cho tài khoản thật:

```cmd
pnpm build
pnpm test:e2e:isolated
```

Tài khoản MySQL trong `.env` cần quyền tạo/xóa database thử. Script chỉ tạo và dọn database ngẫu nhiên mang tiền tố `student_survey_test_`, chạy production server ở cổng 3015 với một worker. Ngưỡng báo cáo trong database thử là 2 để kiểm tra môn đủ/thiếu phản hồi; cấu hình ứng dụng thật không thay đổi. Không chạy seed. Nếu tiến trình bị đóng cưỡng bức, database thử có thể còn lại. Toàn bộ bài nghiệp vụ, kể cả ba hành trình cũ, chạy với dữ liệu riêng; không còn bỏ qua vì thiếu seed.


Xem [vòng đời và báo cáo khảo sát](docs/VONG_DOI_VA_BAO_CAO_KHAO_SAT.md) để sửa/hủy/sao chép đợt nháp, xem tiến độ và báo cáo, phân biệt thời gian tiếp nhận.

Đợt khảo sát có thể [đánh giá từng giảng viên thực dạy](docs/DANH_GIA_GIANG_VIEN_THUC_DAY.md). Phân công một/nhiều người ở lớp học phần trước khi công bố; phiếu và báo cáo chốt theo người dạy tại thời điểm công bố. Đợt cũ giữ chế độ đánh giá môn.
