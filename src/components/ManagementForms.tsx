"use client";
import {useActionFeedback} from "./useActionFeedback";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { manageFaculty } from "@/app/admin/academic/actions";
import { requestUnsavedLeave } from "@/lib/unsaved";
import { updateUser, changeUserState } from "@/app/admin/users/actions";
export function QuickEdit({ title, children }: { title: string; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => { if (open) dialog.current?.showModal(); }, [open]);
  const close = () => requestUnsavedLeave(() => dialog.current?.close(), dialog.current ?? undefined);
  return <><button className="button secondary quick-edit-button" type="button" onClick={() => setOpen(true)}>Sửa nhanh</button><dialog className="management-dialog" ref={dialog} aria-label={title} onClose={() => setOpen(false)} onCancel={e=>{e.preventDefault();close();}}>{open && <><div className="section-heading"><h2>{title}</h2><button className="icon-button" type="button" onClick={close} aria-label="Đóng chỉnh sửa">✕</button></div>{children}</>}</dialog></>;
}
export function FacultyQuickForm({ faculty, remove = false }: { faculty: { id: string; code: string; name: string }; remove?: boolean }) {
  const [message, action, pending] = useActionFeedback(manageFaculty, undefined);
  return <form action={action} className="stack" onSubmit={e => { if (remove && !window.confirm(`Xóa khoa ${faculty.name}? Chỉ xóa được khoa chưa có dữ liệu liên quan.`)) e.preventDefault(); }}><input type="hidden" name="id" value={faculty.id}/><input type="hidden" name="operation" value={remove ? "delete" : "update"}/>{!remove && <><label className="field">Mã khoa<input name="code" className="input" defaultValue={faculty.code} minLength={2} maxLength={30} required/></label><label className="field">Tên khoa<input name="name" className="input" defaultValue={faculty.name} minLength={3} maxLength={120} required/></label></>}{message && <p role="status">{message}</p>}<button className={`button ${remove ? "danger" : ""}`} disabled={pending}>{pending ? "Đang xử lý…" : remove ? "Xóa khoa" : "Lưu khoa"}</button></form>;
}
export function UserBasicsForm({ user, classes }: { user: { id: string; name: string; email: string; phone: string; student?: { studentCode: string; academicClassId: string | null } | null }; classes: { id: string; label: string; facultyId: string }[] }) {
  const [message, action, pending] = useActionFeedback(updateUser, undefined);
  return <form action={action} className="stack"><input type="hidden" name="id" value={user.id}/><p className="notice">Thông tin cá nhân do người dùng tự cập nhật trong Hồ sơ của tôi. Quản trị viên chỉ chỉnh thông tin nghiệp vụ.</p><label className="field">Họ tên<input name="name" className="input" defaultValue={user.name} readOnly minLength={2} maxLength={120} required/></label><label className="field">Email<input name="email" type="email" className="input" defaultValue={user.email} readOnly required/></label><label className="field">Số điện thoại<input name="phone" className="input" defaultValue={user.phone} readOnly maxLength={30}/></label>{user.student && <><label className="field">Mã sinh viên<input name="studentCode" className="input" defaultValue={user.student.studentCode} minLength={3} maxLength={30} required/></label><label className="field">Lớp hành chính và khoa<select name="academicClassId" className="input" defaultValue={user.student.academicClassId ?? ""} required><option value="">Chọn lớp hành chính</option>{classes.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label><p className="muted">Đổi lớp sẽ cập nhật khoa của sinh viên. Các phiếu khảo sát đã giao vẫn giữ nguyên.</p></>}{message && <p role="status">{message}</p>}<button className="button" disabled={pending}>{pending ? "Đang lưu…" : "Lưu người dùng"}</button></form>;
}
export function UserStateForm({ id, operation, onSuccess }: { id: string; operation: "lock" | "unlock" | "delete"; onSuccess?: () => void }) {
  const [message, action, pending] = useActionFeedback(async (previous: string | undefined, form: FormData) => { const result = await changeUserState(previous, form); if (result.startsWith("Đã ")) onSuccess?.(); return result; }, undefined);
  const label = { lock: "Khóa tài khoản", unlock: "Mở khóa", delete: "Xóa người dùng" }[operation];
  return <form action={action} className="stack" onSubmit={e => { if (!window.confirm(operation === "delete" ? "Xóa tài khoản này và các đăng ký học hiện tại? Nếu có lịch sử khảo sát, hệ thống sẽ chặn xóa; bạn có thể khóa tài khoản." : `${label}?`)) e.preventDefault(); }}><input type="hidden" name="id" value={id}/><input type="hidden" name="operation" value={operation}/>{message && <p role="status">{message}</p>}<button className={`button ${operation === "delete" ? "danger" : "secondary"}`} disabled={pending}>{pending ? "Đang xử lý…" : label}</button></form>;
}
