"use client";

import { useActionState } from "react";
import { createCampaign } from "@/app/admin/actions";

export function CampaignForm({ classes, templates }: { classes: { id: string; label: string }[]; templates: { id: string; label: string }[] }) {
  const [error, action, pending] = useActionState(createCampaign, undefined);
  const today = new Date().toISOString().slice(0, 10);
  const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  return <form action={action} className="stack">
    <label className="field">Tên đợt khảo sát<input className="input" name="title" required minLength={3} placeholder="Đánh giá học phần cuối kỳ" /></label>
    <label className="field">Mẫu khảo sát<select className="input" name="templateId" required><option value="">Chọn mẫu đã lưu</option>{templates.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
    <fieldset className="question"><legend><strong>Lớp học phần tham gia</strong></legend><p className="muted">Chọn một hoặc nhiều lớp. Sinh viên thuộc nhiều lớp chỉ nhận một phiếu.</p><div className="class-options">{classes.map(item => <label key={item.id} className="option"><input type="checkbox" name="classIds" value={item.id}/>{item.label}</label>)}</div></fieldset>
    <p className="notice">Đợt mở lúc 00:00 ngày bắt đầu và kết thúc lúc 23:59 ngày cuối, theo giờ Việt Nam. Danh sách sinh viên được chốt khi tạo đợt.</p>
    <div className="grid" style={{marginTop: 0}}><label className="field">Bắt đầu<input className="input" name="startsAt" type="date" defaultValue={today} required /></label><label className="field">Kết thúc<input className="input" name="endsAt" type="date" defaultValue={nextMonth} required /></label></div>
    {error && <p role="alert" className="error">{error}</p>}
    <button className="button" disabled={pending}>{pending ? "Đang tạo…" : "Tạo đợt khảo sát"}</button>
  </form>;
}
