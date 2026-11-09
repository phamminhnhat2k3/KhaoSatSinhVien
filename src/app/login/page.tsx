import { currentUser } from "@/lib/access";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  if (await currentUser()) redirect("/dashboard");
  return <main className="login"><section className="login-card"><p className="eyebrow">Cổng khảo sát đại học</p><h2>Lắng nghe để cùng tiến bộ.</h2><p className="lead">Đăng nhập để thực hiện khảo sát hoặc theo dõi chất lượng giảng dạy trong phạm vi của bạn.</p><LoginForm /><p className="muted" style={{fontSize: ".82rem", marginTop: "1rem"}}>Tài khoản demo được mô tả trong README.</p></section></main>;
}
