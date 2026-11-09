import {RoleTags} from "./RoleTags";
import { Avatar } from "./Avatar";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/actions";
import { NotificationLink, NotificationShortcut } from "./NotificationLink";

export function AppShell({ name, role, children, wide = false, focused = false, compact = false }: { name?: string | null; role: string; children: ReactNode; wide?: boolean;focused?:boolean;compact?:boolean }) {
  return <div className={`shell${focused?" editor-shell":""}`}>
    <a className="skip-link" href="#main-content">Đi đến nội dung chính</a>
    <header className="nav">
      <Link href="/dashboard" className="university-brand"><Image src="/hcm-ute-logo.png" alt="HCM-UTE – Trường Đại học Công nghệ Kỹ thuật TP. Hồ Chí Minh" width={2005} height={593} className="university-logo" priority unoptimized/></Link>
      <nav aria-label="Điều hướng chính" className="nav-links"><Link href="/dashboard" className="nav-home"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="m12 3 10 8h-3v10h-5v-7h-4v7H5V11H2z"/></svg><span>Trang chủ</span></Link><NotificationLink/><Link className="nav-home" href="/help"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1-1.5 2.5M12 16v1"/></svg><span>Hướng dẫn</span></Link><Link href="/profile" className="nav-profile"><Avatar name={name} className="avatar-small"/><span>Hồ sơ</span></Link><form action={logoutAction}><button className="nav-logout" type="submit"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M10 4H4v16h6M14 7l5 5-5 5M8 12h11"/></svg><span>Đăng xuất</span></button></form></nav>
    </header>
    <div className={`workspace${wide ? " workspace-wide" : ""}${focused?" workspace-focused":""}`}>
      {!focused&&<aside className="sidebar" aria-label="Thông tin tài khoản">
        <section className="card account-card"><div className="account-cover" aria-hidden="true"/><div className="account-content"><Avatar name={name}/><h2>{name || "Tài khoản của bạn"}</h2><p><RoleTags roles={role.split(" · ")}/></p>{!compact&&<div className="account-caption">Cộng đồng học tập<br/><strong>Lắng nghe sinh viên</strong></div>}</div></section>
        {!compact&&<section className="card sidebar-note"><p className="eyebrow">Cùng nhau tiến bộ</p><h3>Mỗi ý kiến đều có giá trị.</h3><p className="muted">Góp ý chân thành để nâng cao chất lượng học tập và giảng dạy.</p></section>}
        <nav className="card stack" aria-label="Truy cập nhanh">{role==="Sinh viên"&&<Link className="text-button" href="/student">Khảo sát của tôi</Link>}{role==="Giảng viên"&&<Link className="text-button" href="/lecturer">Kết quả giảng dạy</Link>}<Link className="text-button" href="/profile">Hồ sơ cá nhân</Link><NotificationShortcut/><Link className="text-button" href="/help">Hướng dẫn sử dụng</Link>{role.includes("Trưởng khoa") && <><Link className="text-button" href="/dean">Kết quả khảo sát của khoa</Link><Link className="text-button" href="/dean/people">Tra cứu trong khoa</Link></>}{role.includes("Quản trị viên") && <><Link className="text-button" href="/admin">Quản trị khảo sát</Link><Link className="text-button" href="/admin/users">Tất cả người dùng</Link><Link className="text-button" href="/admin/academic">Quản lý khoa</Link><Link className="text-button" href="/admin/assignments">Phân công học kỳ</Link><Link className="text-button" href="/admin/templates">Thư viện mẫu</Link></>}</nav>
      </aside>}
      <main id="main-content" className="main" tabIndex={-1}>{focused&&<nav className="editor-navigation" aria-label="Điều hướng soạn mẫu"><Link className="text-button" href="/admin/templates">← Thư viện mẫu</Link><details className="editor-menu"><summary>Điều hướng quản trị</summary><div className="card stack"><Link href="/admin">Quản lý khảo sát</Link><Link href="/admin/users">Tất cả người dùng</Link><Link href="/admin/classes/new">Lớp học phần</Link><Link href="/profile">Hồ sơ cá nhân</Link></div></details></nav>}{children}</main>
      {!focused&&<aside className="context-sidebar" aria-label="Hướng dẫn phản hồi"><section className="card"><span className="pill">Không gian lắng nghe</span><h2>Phản hồi có ích bắt đầu từ bạn</h2><ol className="guidance"><li><strong>Cụ thể và rõ ràng</strong><p>Chia sẻ trải nghiệm thực tế trong học phần.</p></li><li><strong>Tôn trọng và xây dựng</strong><p>Đề xuất điều có thể cải thiện cho lần tiếp theo.</p></li><li><strong>Giữ riêng thông tin cá nhân</strong><p>Không ghi tên, mã sinh viên hoặc thông tin nhận diện trong câu trả lời.</p></li></ol></section><p className="workspace-footer">Lắng nghe sinh viên<br/>Kết nối ý kiến · Cải thiện chất lượng</p></aside>}
    </div>
  </div>;
}
