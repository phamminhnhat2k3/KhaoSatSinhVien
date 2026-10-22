import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/actions";
import { NotificationLink } from "./NotificationLink";

export function AppShell({ name, role, children, wide = false }: { name?: string | null; role: string; children: ReactNode; wide?: boolean }) {
  return <div className="shell">
    <a className="skip-link" href="#main-content">Đi đến nội dung chính</a>
    <header className="nav">
      <Link href="/dashboard" className="brand"><span className="brand-mark">L</span><span>Lắng nghe</span></Link>
      <span className="nav-description">Cổng khảo sát sinh viên</span>
      <nav aria-label="Điều hướng chính" className="nav-links"><Link href="/dashboard" className="nav-home"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="m12 3 10 8h-3v10h-5v-7h-4v7H5V11H2z"/></svg><span>Trang chủ</span></Link><NotificationLink/><Link href="/profile" className="nav-profile"><span className="avatar avatar-small" aria-hidden="true">{name?.trim().slice(0, 1) || "L"}</span><span>Hồ sơ</span></Link><form action={logoutAction}><button className="button secondary">Đăng xuất</button></form></nav>
    </header>
    <div className={`workspace${wide ? " workspace-wide" : ""}`}>
      <aside className="sidebar" aria-label="Thông tin tài khoản">
        <section className="card account-card"><div className="account-cover" aria-hidden="true"/><div className="account-content"><span className="avatar" aria-hidden="true">{name?.trim().slice(0, 1) || "L"}</span><h2>{name || "Tài khoản của bạn"}</h2><p className="muted">{role}</p><div className="account-caption">Cộng đồng học tập<br/><strong>Lắng nghe sinh viên</strong></div></div></section>
        <section className="card sidebar-note"><p className="eyebrow">Cùng nhau tiến bộ</p><h3>Mỗi ý kiến đều có giá trị.</h3><p className="muted">Góp ý chân thành để nâng cao chất lượng học tập và giảng dạy.</p></section>
        <nav className="card stack" aria-label="Truy cập nhanh"><Link className="text-button" href="/profile">Hồ sơ cá nhân</Link><Link className="text-button" href="/notifications">Thông báo</Link>{role.includes("Quản trị viên") && <><Link className="text-button" href="/admin">Quản trị khảo sát</Link><Link className="text-button" href="/admin/templates">Thư viện mẫu</Link></>}</nav>
      </aside>
      <main id="main-content" className="main" tabIndex={-1}>{children}</main>
      <aside className="context-sidebar" aria-label="Hướng dẫn phản hồi"><section className="card"><span className="pill">Không gian lắng nghe</span><h2>Phản hồi có ích bắt đầu từ bạn</h2><ol className="guidance"><li><strong>Cụ thể và rõ ràng</strong><p>Chia sẻ trải nghiệm thực tế trong học phần.</p></li><li><strong>Tôn trọng và xây dựng</strong><p>Đề xuất điều có thể cải thiện cho lần tiếp theo.</p></li><li><strong>Giữ riêng thông tin cá nhân</strong><p>Không ghi tên, mã sinh viên hoặc thông tin nhận diện trong câu trả lời.</p></li></ol></section><p className="workspace-footer">Lắng nghe sinh viên<br/>Kết nối ý kiến · Cải thiện chất lượng</p></aside>
    </div>
  </div>;
}
