"use client";
import { useActionState } from "react";
import { forgotPasswordAction,resetPasswordAction } from "@/app/forgot-password/actions";
export function PasswordRecoveryForm({token}:{token?:string}) {
  const [message,action,pending]=useActionState(token===undefined?forgotPasswordAction:resetPasswordAction,undefined);
  return <form action={action} className="stack">{token===undefined?<label className="field">Email tài khoản<input className="input" type="email" name="email" required maxLength={191} autoComplete="email"/></label>:<><input type="hidden" name="token" value={token}/><label className="field">Mật khẩu mới<input className="input" type="password" name="password" required minLength={8} maxLength={100} autoComplete="new-password"/></label><label className="field">Nhập lại mật khẩu mới<input className="input" type="password" name="confirmPassword" required minLength={8} maxLength={100} autoComplete="new-password"/></label></>}{message&&<p role="status">{message}</p>}<button className="button" disabled={pending}>{pending?"Đang xử lý…":token===undefined?"Gửi liên kết đặt lại mật khẩu":"Đặt lại mật khẩu"}</button></form>;
}
