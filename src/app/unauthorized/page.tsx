import Link from "next/link";
export default function Unauthorized() { return <main className="main"><section className="card"><p className="eyebrow">403</p><h2>Bạn không có quyền truy cập</h2><p className="muted">Chức năng này không thuộc vai trò hiện tại của bạn.</p><Link className="button" href="/dashboard">Về trang của tôi</Link></section></main>; }
