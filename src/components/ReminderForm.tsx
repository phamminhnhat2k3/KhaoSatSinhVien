"use client";
import { useActionFeedback } from "./useActionFeedback";
import { sendReminder } from "@/app/admin/reminders";
export function ReminderForm({ id, count }: { id: string; count: number }) {
  const [message, action, pending] = useActionFeedback(sendReminder, undefined);
  return <form action={action} className="card stack"><input type="hidden" name="campaignId" value={id}/><h3>Nhắc hoàn thành khảo sát</h3><p>Còn {count} sinh viên chưa hoàn thành. Chỉ gửi cho tài khoản sinh viên đang hoạt động, tối đa một lần mỗi 24 giờ cho cả đợt.</p><button className="button secondary" disabled={pending || !count}>{pending ? "Đang gửi…" : "Gửi lời nhắc trong web"}</button>{message && <p role="status">{message}</p>}</form>;
}
