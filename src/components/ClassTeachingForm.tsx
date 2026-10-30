"use client";
import {useActionFeedback} from "./useActionFeedback";

import {saveClassTeachers} from "@/app/admin/actions";
export function ClassTeachingForm({classId,teachers,selected}:{classId:string;teachers:{id:string;name:string}[];selected:string[]}) {
  const [message,action,pending]=useActionFeedback(saveClassTeachers,undefined);
  return <details><summary className="text-button">Phân công / Cập nhật</summary><form action={action} className="stack"><input type="hidden" name="classId" value={classId}/><p className="muted">Chọn các giảng viên thực sự dạy lớp này. Phiếu đã công bố giữ nguyên phân công đã chốt.</p><fieldset className="stack" key={selected.join(":")}><legend>Giảng viên thực dạy</legend>{teachers.map(t=><label className="option" key={t.id}><input type="checkbox" name="lecturerIds" value={t.id} defaultChecked={selected.includes(t.id)}/>{t.name}</label>)}{!teachers.length&&<p>Chưa có giảng viên phù hợp trong khoa.</p>}</fieldset>{message&&<p role="status">{message}</p>}<button className="button secondary" disabled={pending}>Lưu phân công</button></form></details>;
}
