import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/actions";

export function AppShell({ name, role, children }: { name?: string | null; role: string; children: ReactNode }) {
  return <div className="shell">
    <header className="nav">
      <Link href="/dashboard" className="brand"><span className="brand-mark">L</span><span>Lắng nghe</span></Link>
      <div className="actions"><span className="muted">{name} · {role}</span><form action={logoutAction}><button className="button secondary">Đăng xuất</button></form></div>
    </header>
    <main className="main">{children}</main>
  </div>;
}
