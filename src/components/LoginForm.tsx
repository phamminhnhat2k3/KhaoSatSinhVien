"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(loginAction, undefined);
  const [notice,setNotice]=useState("");
  useEffect(()=>{const p=new URLSearchParams(window.location.search);if(p.has("passwordChanged"))setNotice("Đã đổi mật khẩu và đăng xuất các phiên cũ. Vui lòng đăng nhập bằng mật khẩu mới.");else if(p.has("passwordReset"))setNotice("Đã đặt lại mật khẩu. Vui lòng đăng nhập bằng mật khẩu mới.");},[]);
  return <>{notice&&<p className="notice" role="status">{notice}</p>}<form action={action} className="stack">
    <label className="field">Email<input className="input" name="email" type="email" autoComplete="email" required placeholder="sinhvien@demo.vn" /></label>
    <label className="field">Mật khẩu<input className="input" name="password" type="password" autoComplete="current-password" minLength={8} required placeholder="••••••••" /></label>
    {error && <p role="alert" className="error">{error}</p>}
    <button className="button" disabled={pending}>{pending ? "Đang đăng nhập…" : "Đăng nhập"}</button>
  </form><Link href="/forgot-password">Quên mật khẩu?</Link></>;
}
