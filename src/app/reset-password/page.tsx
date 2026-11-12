import Link from "next/link";
import { PasswordRecoveryForm } from "@/components/PasswordRecoveryForm";
export const metadata={title:"Đặt lại mật khẩu",robots:{index:false,follow:false}};
export default async function ResetPasswordPage({searchParams}:{searchParams:Promise<{token?:string}>}){const {token}=await searchParams;return <main className="login"><section className="login-card"><h1>Đặt lại mật khẩu</h1>{token&&/^[a-f0-9]{64}$/.test(token)?<><p>Chọn mật khẩu mới ít nhất 8 ký tự. Đặt lại thành công sẽ vô hiệu hóa mọi phiên đăng nhập cũ.</p><PasswordRecoveryForm token={token}/></>:<p role="alert">Liên kết không hợp lệ. Hãy yêu cầu liên kết mới.</p>}<Link href="/forgot-password">Yêu cầu liên kết mới</Link></section></main>;}
