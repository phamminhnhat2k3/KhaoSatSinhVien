import Link from "next/link";
import { PasswordRecoveryForm } from "@/components/PasswordRecoveryForm";
export const metadata={title:"Quên mật khẩu",robots:{index:false,follow:false}};
export default function ForgotPasswordPage(){return <main className="login"><section className="login-card"><h1>Quên mật khẩu</h1><p>Nhập email đã đăng ký. Liên kết đặt lại chỉ dùng một lần và có hiệu lực 15 phút.</p><PasswordRecoveryForm/><Link href="/login">← Đăng nhập</Link></section></main>;}
