# Đổi và khôi phục mật khẩu

## Thu hồi phiên

- Đăng nhập tạo dấu phiên bản từ giá trị băm mật khẩu, không đưa mật khẩu hoặc giá trị băm Argon2 vào dữ liệu phiên trả về trình duyệt.
- Mỗi lần máy chủ kiểm tra phiên đều đối chiếu trạng thái tài khoản và phiên bản mật khẩu hiện tại. Mật khẩu thay đổi thì các cookie đăng nhập trước đó mất hiệu lực, kể cả cookie bị sao chép để dùng lại.
- Đổi mật khẩu vẫn cần đúng mật khẩu cũ, mật khẩu mới tối thiểu 8 ký tự và xác nhận trùng khớp. Đổi thành công đăng xuất thiết bị hiện tại, các thiết bị còn lại bị chặn ở yêu cầu kế tiếp. Không thể xóa màn hình hoặc dữ liệu đã tải trước đó trên một thiết bị khác.
- Khi cập nhật chức năng lần đầu, cookie cũ chưa có dấu phiên bản cũng bị yêu cầu đăng nhập lại.

## Gmail gửi thư khôi phục

Thêm cấu hình vào file .env trên máy. Xem .env.gmail.example. Không ghi mật khẩu thật vào Git hoặc gửi trong chat.

```dotenv
GMAIL_USER=your-sender@gmail.com
GMAIL_APP_PASSWORD=
APP_URL=http://localhost:3000
```

- GMAIL_APP_PASSWORD là Mật khẩu ứng dụng 16 ký tự do Google cấp, không phải mật khẩu đăng nhập Gmail. Cần bật xác minh hai bước, tài khoản tổ chức có thể không được phép tạo mật khẩu ứng dụng.
- SMTP cố định smtp.gmail.com, cổng 465, TLS. Không tắt kiểm tra chứng chỉ, không cho mẫu thư đọc tệp hoặc URL tùy ý.
- Kiểm tra xác thực bằng `node --env-file=.env --import tsx scripts/check-gmail.ts`. Lệnh này chỉ xác thực SMTP, không gửi thư và không in bí mật.
- Khởi động lại web sau khi sửa .env. Tài khoản gửi và tài khoản nhận có thể khác nhau. Không thay email của các người dùng khác khi thay địa chỉ gửi.
- Link được tạo từ APP_URL cấu hình trên máy chủ, không lấy tên máy chủ do khách gửi lên. Local dùng localhost, khi triển khai cần URL HTTPS. Link localhost chỉ mở được trên chính máy chạy web.

## Quên mật khẩu

- Từ trang đăng nhập chọn Quên mật khẩu, nhập email tài khoản.
- Phản hồi giống nhau cho email tồn tại và không tồn tại. Khi chưa cấu hình gửi thư, giao diện báo chức năng email chưa sẵn sàng.
- Tài khoản đang hoạt động nhận link có hiệu lực 15 phút, chỉ dùng một lần. Cơ sở dữ liệu chỉ lưu băm token và phiên bản mật khẩu, không lưu token nguyên bản.
- Mỗi email tối đa một yêu cầu trong 5 phút. Có giới hạn bộ nhớ theo email trên tiến trình và kiểm tra lịch sử trong giao dịch database để hạn chế yêu cầu đồng thời trên nhiều tiến trình.
- Mở link, nhập mật khẩu mới và xác nhận lần hai. Đặt lại thành công ghi nhật ký và thông báo, thu hồi các link còn lại cùng mọi phiên dùng mật khẩu cũ.
- Link đã dùng, hết hạn, thuộc tài khoản bị khóa hoặc được tạo trước lần đổi mật khẩu gần nhất đều không còn hợp lệ.
- Trang đặt lại có chính sách không gửi referrer và không cache. Không có API công khai trả link hoặc token để bỏ qua email.

Hướng dẫn chính thức: https://support.google.com/accounts/answer/185833 và https://nodemailer.com/guides/using-gmail.
