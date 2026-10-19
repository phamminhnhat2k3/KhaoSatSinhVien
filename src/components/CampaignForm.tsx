"use client";

import { useActionState } from "react";
import { createCampaign } from "@/app/admin/actions";

export function CampaignForm({ classes }: { classes: { id: string; label: string }[] }) {
  const [error, action, pending] = useActionState(createCampaign, undefined);
  const today = new Date().toISOString().slice(0, 10);
  const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  return <form action={action} className="stack">
    <label className="field">Tên đợt khảo sát<input className="input" name="title" required minLength={3} placeholder="Đánh giá học phần cuối kỳ" /></label>
    <label className="field">Lớp học phần<select className="input" name="classId" required><option value="">Chọn lớp</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    <div className="grid" style={{marginTop: 0}}><label className="field">Bắt đầu<input className="input" name="startsAt" type="date" defaultValue={today} required /></label><label className="field">Kết thúc<input className="input" name="endsAt" type="date" defaultValue={nextMonth} required /></label></div>
    {error && <p role="alert" className="error">{error}</p>}
    <button className="button" disabled={pending}>{pending ? "Đang tạo…" : "Tạo đợt khảo sát"}</button>
  </form>;
}
