"use client";
import { startTransition, useActionState, useRef, useState } from "react";
import { requestUnsavedLeave, unsavedForms, unsavedChanged, useUnsavedForm } from "@/lib/unsaved";
import { showActionToast } from "@/lib/action-feedback";
import { importData, type ImportState } from "@/app/admin/import/actions";
import { importColumns, type ImportKind } from "@/modules/academic/import-csv";
function ImportEditor({ kind }: { kind: ImportKind }) {
  const ref = useRef<HTMLFormElement>(null), [dirty, setDirty] = useState(false);
  const [state, action, pending] = useActionState(async (previous: ImportState, form: FormData) => { const result = await importData(previous, form); if (result.done) { setDirty(false); if (ref.current) unsavedForms.delete(ref.current); unsavedChanged(); } showActionToast(result.message, result.ok ? "success" : "error"); return result; }, { ok: false, message: "" } as ImportState);
  useUnsavedForm(ref, dirty, { label: "Tệp dữ liệu đang chuẩn bị nhập" });
  const [changed, setChanged] = useState(false);
  function template() {
    const example = { students: "Nguyễn Văn An,sv.an@example.com,SV001,CNTT25-CQ", lecturers: "Nguyễn Minh Anh,gv.anh@example.com,GV001,CNTT,no", assignments: "Học kỳ 1 · 2026–2027,CNTT25-CQ,CNTT101-1-HK1" }[kind];
    const url = URL.createObjectURL(new Blob(["\uFEFF"+importColumns[kind].join(",")+"\r\n"+example+"\r\n"], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `${kind}-mau.csv`; a.click(); URL.revokeObjectURL(url);
  }
  return <form ref={ref} data-leave-managed method="post" className="card stack" onChange={e => { setDirty(true); if ((e.target as HTMLInputElement).name === "file") setChanged(true); }} onSubmit={e => { e.preventDefault(); setChanged(false); const data = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter); startTransition(() => action(data)); }}><input name="kind" type="hidden" value={kind}/><div className="actions"><button type="button" className="button secondary" onClick={template}>Tải CSV mẫu</button></div><label className="field">Tệp CSV UTF-8<input className="input" name="file" type="file" accept=".csv,text/csv" required/></label>{kind !== "assignments" && <label className="field">Mật khẩu khởi tạo chung<input className="input" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={100}/><small>Nhập khi xác nhận tạo tài khoản. Không ghi mật khẩu vào tệp CSV.</small></label>}{kind === "assignments" && <p className="notice">Mỗi dòng là một lớp học phần. Tất cả dòng cùng lớp hành chính và học kỳ sẽ thay thế toàn bộ phân công chung của lớp trong học kỳ đó. Phải đưa đủ các môn cần giữ vào tệp. Không thay phiếu đã công bố và danh sách học riêng của sinh viên.</p>}<button className="button secondary" name="intent" value="preview" disabled={pending}>Kiểm tra và xem trước</button>{state.message && <p role="status" className={state.ok ? "notice" : "error"}>{state.message}</p>}{state.rows && <div className="table-scroll"><table><caption>Xem trước dữ liệu nhập</caption><thead><tr><th>Dòng</th>{importColumns[kind].map(c => <th key={c}>{c}</th>)}<th>Kiểm tra</th></tr></thead><tbody>{state.rows.map(r => <tr key={r.line}><td>{r.line}</td>{r.values.map((v, i) => <td key={i}>{v}</td>)}<td className={r.error ? "error" : ""}>{r.error || "Hợp lệ"}</td></tr>)}</tbody></table></div>}{state.valid && !state.done && !changed && <><label className="option"><input type="checkbox" name="confirm" value="yes"/>Tôi đã kiểm tra dữ liệu và đồng ý nhập toàn bộ danh sách{kind === "assignments" ? ", thay thế phân công của các lớp/học kỳ trong tệp" : ""}.</label><button className="button" name="intent" value="apply" disabled={pending}>{pending ? "Đang nhập…" : "Xác nhận nhập dữ liệu"}</button></>}</form>;
}
export function ImportForm() {
  const [kind, setKind] = useState<ImportKind>("students");
  return <><label className="field">Loại dữ liệu<select className="input" value={kind} onChange={e => { const next = e.target.value as ImportKind; requestUnsavedLeave(() => setKind(next)); }}><option value="students">Sinh viên</option><option value="lecturers">Giảng viên / Trưởng khoa</option><option value="assignments">Phân công lớp theo học kỳ</option></select></label><ImportEditor key={kind} kind={kind}/></>;
}
