"use client";
import { useActionFeedback } from "./useActionFeedback";
import { sendReminder } from "@/app/admin/reminders";
export function ReminderForm({ id, count }: { id: string; count: number }) {
  const [message, action, pending] = useActionFeedback(sendReminder, undefined);
  return <form action={action} className="card stack"><input type="hidden" name="campaignId" value={id}/><h3>Nhắc hoàn thành khảo sát</h3><p>Còn {count} sinh viên chưa hoàn thành. Máy chủ tự kiểm tra mỗi 15 phút khi đợt còn tối đa 3 ngày. Bạn vẫn có thể nhắc tay. Chỉ gửi cho sinh viên đang hoạt động và chưa hoàn thành, tránh nhắc lặp cùng người trong 24 giờ.</p><button className="button secondary" disabled={pending || !count}>{pending ? "Đang gửi…" : "Gửi lời nhắc trong web"}</button>{message && <p role="status">{message}</p>}</form>;
}
