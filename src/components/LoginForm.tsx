"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(loginAction, undefined);
  return <form action={action} className="stack">
    <label className="field">Email<input className="input" name="email" type="email" autoComplete="email" required placeholder="sinhvien@demo.vn" /></label>
    <label className="field">Mật khẩu<input className="input" name="password" type="password" autoComplete="current-password" minLength={8} required placeholder="••••••••" /></label>
    {error && <p role="alert" className="error">{error}</p>}
    <button className="button" disabled={pending}>{pending ? "Đang đăng nhập…" : "Đăng nhập"}</button>
  </form>;
}
