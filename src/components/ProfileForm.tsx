"use client";
import { startTransition, useActionState, type FormEvent } from "react";
import { updatePassword, updateProfile } from "@/app/profile/actions";

export function ProfileForm({ profile }: { profile: { name: string; phone: string; department: string; bio: string; coverTheme: string } }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => action(data));
  }
  return <form method="post" onSubmit={submit} className="stack">
    <div className="form-columns profile-fields"><label className="field">Họ và tên<input className="input" name="name" defaultValue={profile.name} required minLength={2} maxLength={100} autoComplete="name"/></label><label className="field">Số điện thoại<input className="input" name="phone" defaultValue={profile.phone} type="tel" maxLength={20} autoComplete="tel" placeholder="Chưa cập nhật"/></label></div>
    <label className="field">Khoa / đơn vị<input className="input" name="department" defaultValue={profile.department} maxLength={120} placeholder="Ví dụ: Khoa Công nghệ thông tin"/></label>
    <label className="field">Giới thiệu<textarea className="input" name="bio" defaultValue={profile.bio} maxLength={1000} rows={4} placeholder="Một vài dòng giới thiệu về bạn…"/></label>
    <label className="field">Màu ảnh bìa<select className="input" name="coverTheme" defaultValue={profile.coverTheme}><option value="blue">Xanh dương</option><option value="green">Xanh lá</option><option value="violet">Tím</option></select></label>
    <p className="muted">Thông tin này chỉ hiển thị trong hồ sơ tài khoản của bạn, không gắn vào câu trả lời khảo sát.</p>
    {state && <p role="status" className={state.ok ? "notice" : "error"}>{state.message}</p>}
    <div className="actions"><button className="button" disabled={pending}>{pending ? "Đang lưu…" : "Lưu thay đổi"}</button></div>
  </form>;
}
export function PasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined);
  return <form className="stack" action={action}><label className="field">Mật khẩu hiện tại<input className="input" name="currentPassword" type="password" autoComplete="current-password" required/></label><div className="form-columns profile-fields"><label className="field">Mật khẩu mới<input className="input" name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={100} required/></label><label className="field">Xác nhận mật khẩu mới<input className="input" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={100} required/></label></div>{state && <p role="status" className={state.ok ? "notice" : "error"}>{state.message}</p>}<div className="actions"><button className="button secondary" disabled={pending}>{pending ? "Đang cập nhật…" : "Đổi mật khẩu"}</button></div></form>;
}
