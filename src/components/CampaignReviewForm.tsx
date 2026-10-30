"use client";
import {useActionFeedback} from "./useActionFeedback";

import { reviewCampaign } from "@/app/dean/actions";
export function CampaignReviewForm({ id }: { id: string }) {
  const [message, action, pending] = useActionFeedback(reviewCampaign, undefined);
  return <form action={action} className="stack"><input type="hidden" name="id" value={id}/><label className="field">Quyết định<select className="input" name="decision" required><option value="approve">Đồng ý công bố</option><option value="changes">Yêu cầu chỉnh sửa</option></select></label><label className="field">Ý kiến xét duyệt<textarea className="input" name="note" maxLength={2000}/></label>{message && <p role="status">{message}</p>}<button className="button" disabled={pending}>{pending ? "Đang lưu…" : "Lưu xét duyệt"}</button></form>;
}
