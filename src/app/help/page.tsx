import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/access";
import { roleGuides } from "@/modules/help/guides";

export default async function HelpPage() {
  const user = await requireUser();
  const guides = roleGuides.filter(guide => user.roles.includes(guide.role));
  return <AppShell name={user.name} role={guides.map(g => g.title).join(" · ")} wide compact>
    <p className="eyebrow">Tra cứu nhanh</p><h1>Hướng dẫn sử dụng</h1>
    <p className="lead">Các bước dành cho vai trò hiện tại của bạn. Bấm vào từng mục để xem.</p>
    {guides.map(guide => <section key={guide.role} className="card section-title"><h2>{guide.title}</h2>
      {guide.steps.map(step => <details className="question" key={step.title}><summary><strong>{step.title}</strong></summary><ol className="guidance">{step.instructions.map(text => <li key={text}>{text}</li>)}</ol><Link className="text-button" href={step.href}>Mở chức năng →</Link></details>)}
    </section>)}
    <section className="card section-title"><h2>Hồ sơ và thông báo</h2><ul className="guidance"><li>Trong Hồ sơ cá nhân, bạn có thể cập nhật thông tin, ảnh đại diện và đổi mật khẩu.</li><li>Bấm chuông để mở bảng thông báo bên phải, chọn thông báo để đến nội dung liên quan.</li><li>Thông tin cá nhân do chính người dùng cập nhật. Không đưa thông tin nhận diện vào nội dung phản hồi khảo sát.</li></ul><Link className="text-button" href="/profile">Mở hồ sơ cá nhân →</Link></section>
  </AppShell>;
}
