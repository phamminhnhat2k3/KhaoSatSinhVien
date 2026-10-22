# Hệ thống khảo sát và phản hồi sinh viên

Ứng dụng khảo sát sinh viên đang được phát triển theo [phương án kỹ thuật](docs/PHUONG_AN_KY_THUAT_MVP.md). Đã có các luồng cơ bản cho quản trị viên, sinh viên và giảng viên; nghiệm thu đầy đủ với cơ sở dữ liệu thật vẫn cần được thực hiện.

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
- Quản trị mẫu gồm bốn loại câu hỏi, tạo/công bố/đóng đợt khảo sát và chọn lớp học phần.
- Sinh viên chỉ thấy khảo sát được giao, có thể lưu nháp và chỉ gửi một lần.
- Transaction đồng thời tạo phản hồi và ghi nhận hoàn thành; `Submission` không chứa khóa định danh sinh viên.
- Báo cáo theo phạm vi giảng dạy, chỉ mở sau khi đóng và đủ `MIN_REPORT_RESPONSES`; hỗ trợ CSV.
- Giao diện tiếng Việt, responsive và dữ liệu seed cho nghiệm thu.

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
