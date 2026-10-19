# Hệ thống khảo sát và phản hồi sinh viên

MVP dùng chung trong trường đại học để quản lý đợt khảo sát, thu phản hồi ẩn danh, tổng hợp kết quả và theo dõi chất lượng học phần. Ứng dụng đã có đủ ba hành trình quản trị viên, sinh viên và giảng viên theo [phương án kỹ thuật](docs/PHUONG_AN_KY_THUAT_MVP.md).

## Chạy local

Yêu cầu: Node.js 20.19 trở lên, pnpm và Docker Desktop.

```powershell
Copy-Item .env.example .env
# Thay AUTH_SECRET trong .env bằng chuỗi ngẫu nhiên tối thiểu 32 ký tự.
docker compose up -d
pnpm install
pnpm db:push
$env:SEED_PASSWORD = Read-Host -AsSecureString | ConvertFrom-SecureString -AsPlainText
pnpm db:seed
pnpm dev
```

Mở `http://localhost:3000`. Dữ liệu seed tạo các tài khoản `admin@demo.vn`, `giangvien@demo.vn` và `sinhvien1@demo.vn` đến `sinhvien5@demo.vn`; tất cả dùng mật khẩu đã nhập qua `SEED_PASSWORD`. Mật khẩu không được lưu trong Git.

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

E2E đầy đủ cần MySQL đã seed và các biến `DATABASE_URL`, `AUTH_SECRET`, `SEED_PASSWORD`. Chạy `pnpm exec playwright install chromium` một lần nếu máy chưa có trình duyệt Playwright.
