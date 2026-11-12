import { gmailTransport } from "../src/modules/profile/gmail";
try { await gmailTransport().verify(); console.log("SMTP Gmail đã kết nối và xác thực thành công. Chưa gửi email."); }
catch { console.error("Chưa xác thực được Gmail. Kiểm tra GMAIL_USER, Mật khẩu ứng dụng 16 ký tự, xác minh hai bước, quyền của tài khoản trường và kết nối mạng."); process.exitCode=1; }
