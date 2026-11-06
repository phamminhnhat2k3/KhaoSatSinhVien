"use client";
import {useActionFeedback} from "./useActionFeedback";

import {saveClassTeachers} from "@/app/admin/actions";
export function ClassTeachingForm({classId,teachers,selected}:{classId:string;teachers:{id:string;name:string}[];selected:string[]}) {
  const [message,action,pending]=useActionFeedback(saveClassTeachers,undefined);
  return <details><summary className="text-button">Phân công / Cập nhật</summary><form action={action} className="stack"><input type="hidden" name="classId" value={classId}/><p className="muted">Mỗi lớp học phần do một giảng viên phụ trách. Phiếu đã công bố giữ nguyên phân công đã chốt.</p>{selected.length>1&&<p className="notice">Phân công cũ có nhiều giảng viên. Chọn một người để cập nhật.</p>}<label className="field">Giảng viên thực dạy<select className="input" name="lecturerIds" key={selected.join(":")} defaultValue={selected.length===1?selected[0]:""}><option value="">Chưa phân công</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>{!teachers.length&&<p>Chưa có giảng viên phù hợp trong khoa.</p>}{message&&<p role="status">{message}</p>}<button className="button secondary" disabled={pending}>Lưu phân công</button></form></details>;
}
