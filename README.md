# Hệ thống khảo sát và phản hồi sinh viên

Ứng dụng khảo sát sinh viên đang được phát triển theo [phương án kỹ thuật](docs/PHUONG_AN_KY_THUAT_MVP.md). Các luồng trình dựng, học vụ, hồ sơ và thông báo có nghiệm thu Playwright với dữ liệu MySQL riêng. Xem [báo cáo tiến độ](docs/TIEN_DO_2026-10-23.md) để phân biệt phần đã hoàn thành và phần chưa triển khai.

## Chạy local

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

Tạo dữ liệu mẫu **chỉ trên cơ sở dữ liệu thử nghiệm trống**. Lệnh seed xóa dữ liệu nghiệp vụ hiện có trước khi tạo lại; không chạy trên dữ liệu cần giữ.

`pnpm db:seed` tự nạp `DATABASE_URL` từ file `.env` ở thư mục gốc dự án. `SEED_PASSWORD` được đặt trong terminal hiện tại; biến môi trường của terminal được ưu tiên hơn giá trị trong `.env`.

Nếu terminal là Command Prompt (CMD, dấu nhắc dạng `C:\KhaoSatSinhVien>`), dùng:

```cmd
set "SEED_PASSWORD=THAY_BANG_MAT_KHAU_TOI_THIEU_8_KY_TU"
pnpm db:seed
set "SEED_PASSWORD="
pnpm dev
```

Nếu dùng PowerShell 7, dùng:

```powershell
$env:SEED_PASSWORD = Read-Host -AsSecureString | ConvertFrom-SecureString -AsPlainText
pnpm db:seed
Remove-Item Env:SEED_PASSWORD
pnpm dev
```

Mở `http://localhost:3000`. Dữ liệu seed tạo các tài khoản `admin@demo.vn`, `giangvien@demo.vn` và `sinhvien1@demo.vn` đến `sinhvien5@demo.vn`; tất cả dùng mật khẩu đã nhập qua `SEED_PASSWORD`. Mật khẩu không được lưu trong Git.

Những lần sau, khi dịch vụ `MySQL80` đang chạy, chỉ cần `pnpm dev`. Giữ terminal mở và nhấn `Ctrl+C` để dừng website. Không cần Docker.

## Chức năng chính

- Auth.js Credentials, mật khẩu Argon2id và phân quyền máy chủ theo `STUDENT`, `LECTURER`, `ADMIN`.
- Quản trị có trang riêng cho mẫu, đợt, lớp và sinh viên. Trình dựng mẫu hỗ trợ kéo thả, nhân bản, đổi thứ tự bằng bàn phím, bắt buộc/tùy chọn, xem trước; lựa chọn tự nhập và thang số nguyên từ 0 đến 1.000 với bước nhảy tùy chỉnh. Mẫu đã lưu được bảo toàn, chỉnh tiếp bằng cách tạo bản sao.
- Tạo đợt theo khoa hoặc toàn trường, gắn học kỳ và mẫu câu hỏi chung. Đợt khoa có thể kèm mẫu đánh giá môn; mỗi sinh viên chỉ nhận các môn thực học trong học kỳ thuộc phạm vi đã chọn. Người nhận và phần môn được chốt khi công bố, không phải khi tạo nháp.
- `/admin/academic`: tạo khoa, lớp hành chính và học kỳ. Lớp hành chính quản lý sinh viên theo khoa; lớp học phần là lớp đăng ký môn với giảng viên trong một học kỳ.
- `/admin/students`: danh sách tất cả sinh viên có tìm MSSV/tên/email, lọc khoa/lớp hành chính và phân trang. Hồ sơ học vụ cho phép phân lớp và bổ sung đăng ký lớp học phần; tạo sinh viên không bắt buộc ghi danh môn ngay.
- Admin bấm tên khảo sát hoặc “Xem bài đánh giá” để mở danh sách phiếu đã nộp và xem từng câu trả lời ngay khi có phiếu gửi. Phiếu không gắn tên/mã sinh viên; quyền này chỉ dành cho admin, không thay đổi điều kiện mở báo cáo tổng hợp của giảng viên.
- Sinh viên chỉ thấy khảo sát được giao, có thể lưu nháp và chỉ gửi một lần.
- Transaction đồng thời tạo phản hồi và ghi nhận hoàn thành; `Submission` không chứa khóa định danh sinh viên.
- Báo cáo theo phạm vi giảng dạy, chỉ mở sau khi đóng và đủ `MIN_REPORT_RESPONSES` cho từng môn; hỗ trợ CSV với số người được giao và số phiếu thực tế của từng phần. Giảng viên không được xem phần chung của khoa/toàn trường qua báo cáo môn.
- Giao diện tiếng Việt, responsive và dữ liệu seed cho nghiệm thu.
- `/profile`: hồ sơ cá nhân cho cả ba vai trò, thông tin nghiệp vụ chỉ đọc, chỉnh họ tên/liên hệ/đơn vị/giới thiệu/màu bìa và đổi mật khẩu có xác thực mật khẩu cũ. Chưa hỗ trợ tải ảnh đại diện; đổi mật khẩu không thu hồi các phiên đã đăng nhập.
- `/notifications`: thông báo trong ứng dụng khi công bố/đóng đợt (sinh viên được mời, giảng viên phụ trách và admin thực hiện), hoặc khi tự đổi mật khẩu. Có bộ lọc, phân trang, đánh dấu đọc theo chủ sở hữu và số chưa đọc tự cập nhật mỗi 30 giây khi trang đang hiển thị. Chưa gửi email/push.

Sau khi cập nhật mã nguồn, dừng dev server rồi chạy `pnpm db:migrate` và `pnpm exec prisma generate` trước khi `pnpm dev`. Các migration mới bổ sung cột/bảng và mở rộng độ dài nội dung, không cần chạy lại seed. Ngày khảo sát được hiểu theo giờ Việt Nam, bao gồm trọn ngày kết thúc.

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

E2E đầy đủ cần MySQL đã seed và cấu hình `DATABASE_URL`, `AUTH_SECRET` trong `.env`. Đặt `$env:RUN_DB_E2E = '1'` và nhập lại `$env:SEED_PASSWORD` trước khi chạy `pnpm test:e2e`; nếu không, ba kịch bản dữ liệu sẽ bị bỏ qua. Chạy `pnpm exec playwright install chromium` một lần nếu máy chưa có trình duyệt Playwright. Các kịch bản này thay đổi dữ liệu, chỉ chạy trên cơ sở dữ liệu nghiệm thu riêng.

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

Tài khoản MySQL trong `.env` cần quyền tạo/xóa database thử. Script chỉ tạo và dọn database ngẫu nhiên mang tiền tố `student_survey_test_`, chạy production server ở cổng 3015 với một worker. Ngưỡng báo cáo trong database thử là 2 để kiểm tra môn đủ/thiếu phản hồi; cấu hình ứng dụng thật không thay đổi. Không chạy seed. Nếu tiến trình bị đóng cưỡng bức, database thử có thể còn lại. Ba bài cũ phụ thuộc seed vẫn được bỏ qua.
