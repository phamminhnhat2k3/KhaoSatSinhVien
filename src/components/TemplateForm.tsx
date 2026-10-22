"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createTemplate } from "@/app/admin/templates/actions";
import { moveQuestion, newQuestion, questionTypes, templateSchema, type QuestionInput, type TemplateInput } from "@/modules/templates/rules";
import { QuestionFields } from "./QuestionFields";

type EditorQuestion = QuestionInput & { key: string };
export function TemplateForm({ initial }: { initial?: TemplateInput }) {
  const [title, setTitle] = useState(initial ? `${initial.title} (bản sao)` : "");
  const [questions, setQuestions] = useState<EditorQuestion[]>(() => (initial?.questions ?? []).map((q, i) => ({ ...q, key: `initial-${i}` })));
  const [preview, setPreview] = useState(false);
  const [error, action, pending] = useActionState(createTemplate, undefined);
  const [validation, setValidation] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const dirty = useRef(false);
  const nextKey = useRef(0);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty.current) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  function change(next: EditorQuestion[]) { dirty.current = true; setQuestions(next); setValidation([]); }
  function add(type: QuestionInput["type"], position = questions.length) {
    if (questions.length >= 100) { setMessage("Đã đạt giới hạn 100 câu hỏi."); return; }
    const next = [...questions];
    next.splice(position, 0, { ...newQuestion(type), key: `new-${nextKey.current++}` });
    change(next); setMessage(`Đã thêm câu ${questionTypes[type]} tại vị trí ${position + 1}.`);
  }
  function update(index: number, data: Partial<QuestionInput>) { change(questions.map((q, i) => i === index ? { ...q, ...data } : q)); }
  function move(from: number, to: number) { change(moveQuestion(questions, from, to)); setMessage(`Đã chuyển câu ${from + 1} đến vị trí ${to + 1}.`); }
  function drop(event: React.DragEvent, index: number) {
    event.preventDefault(); event.stopPropagation();
    const type = event.dataTransfer.getData("question-type") as QuestionInput["type"];
    if (Object.hasOwn(questionTypes, type)) add(type, index);
    else { const raw = event.dataTransfer.getData("question-index"); if (/^\d+$/.test(raw)) move(Number(raw), Math.min(index, questions.length - 1)); }
  }
  return <form action={action} onSubmit={event => {
    const parsed = templateSchema.safeParse({ title, questions });
    if (!parsed.success) { event.preventDefault(); setValidation(parsed.error.issues.map(i => `${typeof i.path[1] === "number" ? `Câu ${i.path[1] + 1}: ` : ""}${i.message}`)); }
    else dirty.current = false;
  }}>
    <input type="hidden" name="template" value={JSON.stringify({ title, questions })}/>
    <div className="builder-toolbar card"><div><strong>{questions.length} câu hỏi</strong><span className="muted"> · {questions.filter(q => q.required).length} bắt buộc</span></div><div className="actions"><button type="button" className="button secondary" onClick={() => setPreview(!preview)}>{preview ? "Tiếp tục chỉnh sửa" : "Xem trước"}</button><button className="button" disabled={pending}>{pending ? "Đang lưu…" : "Lưu mẫu khảo sát"}</button></div></div>
    <div className="builder-layout">
      <aside className="card toolbox"><p className="eyebrow">Thư viện câu hỏi</p><h2>Thêm nội dung</h2><p className="muted">Kéo vào vị trí muốn thêm, hoặc bấm để thêm cuối mẫu.</p>{Object.entries(questionTypes).map(([type, label], i) => <button key={type} type="button" draggable={!preview && !pending} disabled={preview || pending} className="tool-item" onDragStart={e => e.dataTransfer.setData("question-type", type)} onClick={() => add(type as QuestionInput["type"])}><span className="tool-symbol" aria-hidden="true">{["#", "◉", "☑", "T"][i]}</span><span>{label}</span><span aria-hidden="true">＋</span></button>)}<p className="muted">Có thể đổi thứ tự bằng các nút ↑ ↓. Tối đa 100 câu hỏi.</p></aside>
      <div className="stack">
        {(error || validation.length > 0) && <div className="notice error" role="alert">{error}{validation.map((v, i) => <p key={i}>{v}</p>)}</div>}
        <p className="sr-only" aria-live="polite">{message}</p>
        <section className="card template-intro"><p className="eyebrow">{preview ? "Góc nhìn người trả lời" : "Thông tin mẫu"}</p>{preview ? <h2>{title || "Mẫu khảo sát chưa đặt tên"}</h2> : <label className="field">Tên mẫu khảo sát<input className="input title-input" value={title} onChange={e => { dirty.current = true; setTitle(e.target.value); }} maxLength={120} placeholder="Ví dụ: Đánh giá chất lượng học phần"/></label>}<p className="muted">{preview ? "Đây là bản xem trước. Câu trả lời tại đây không được lưu." : "Mẫu được lưu độc lập. Bạn sẽ chọn mẫu khi tạo đợt khảo sát."}</p></section>
        {questions.map((q, index) => preview ? <fieldset className="card" key={q.key}><legend>{index + 1}. {q.content || "Câu hỏi chưa có nội dung"}{q.required && " *"}</legend><QuestionFields question={q} name={`preview-${q.key}`}/></fieldset> : <section className="card question-editor" key={q.key} onDragOver={e => e.preventDefault()} onDrop={e => drop(e, index)}>
          <div className="question-editor-heading"><span className="pill">Câu {index + 1} · {questionTypes[q.type]}</span><div className="actions"><button type="button" className="icon-button drag-handle" draggable onDragStart={e => e.dataTransfer.setData("question-index", String(index))} aria-label={`Kéo câu ${index + 1}`}>⠿</button><button type="button" className="icon-button" disabled={index === 0} aria-label={`Đưa câu ${index + 1} lên`} onClick={() => move(index, index - 1)}>↑</button><button type="button" className="icon-button" disabled={index === questions.length - 1} aria-label={`Đưa câu ${index + 1} xuống`} onClick={() => move(index, index + 1)}>↓</button><button type="button" className="icon-button" aria-label={`Nhân bản câu ${index + 1}`} disabled={questions.length >= 100} onClick={() => { const next = [...questions]; next.splice(index + 1, 0, { ...q, options: q.options.map(o => ({ ...o })), key: `new-${nextKey.current++}` }); change(next); }}>Nhân bản</button><button type="button" className="icon-button text-danger" aria-label={`Xóa câu ${index + 1}`} onClick={() => { if (!q.content || window.confirm(`Xóa câu ${index + 1}?`)) change(questions.filter((_, i) => i !== index)); }}>Xóa</button></div></div>
          <label className="field">Nội dung câu {index + 1}<textarea className="input" value={q.content} maxLength={1000} rows={2} onChange={e => update(index, { content: e.target.value })} placeholder="Nhập câu hỏi rõ ràng, cụ thể…"/></label>
          {q.type === "SCALE" && <div className="scale-settings"><label className="field">Mẫu thang điểm<select className="input" value="" onChange={e => { if (e.target.value) update(index, { scaleMin: 1, scaleMax: Number(e.target.value), scaleStep: 1 }); }}><option value="">Chọn nhanh hoặc tùy chỉnh</option>{[5, 10, 100].map(n => <option key={n} value={n}>1 đến {n}</option>)}</select></label><div className="form-columns">{(["scaleMin", "scaleMax", "scaleStep"] as const).map((field, i) => <label className="field" key={field}>{["Điểm thấp nhất", "Điểm cao nhất", "Bước nhảy"][i]}<input className="input" type="number" min={field === "scaleMin" ? 0 : 1} max={1000} step={1} value={q[field]} onChange={e => update(index, { [field]: Number(e.target.value) })}/></label>)}</div><small className="muted">Ví dụ: 0 → 100, bước 10. Thang dài sẽ hiển thị ô nhập điểm thay vì hàng trăm nút.</small></div>}
          {(q.type === "SINGLE" || q.type === "MULTIPLE") && <div className="stack">{q.options.map((o, oi) => <div className="option-editor" key={o.value}><span aria-hidden="true">{q.type === "SINGLE" ? "○" : "□"}</span><input className="input" aria-label={`Lựa chọn ${oi + 1} của câu ${index + 1}`} value={o.label} maxLength={200} placeholder={`Lựa chọn ${oi + 1}`} onChange={e => update(index, { options: q.options.map((option, j) => j === oi ? { ...option, label: e.target.value } : option) })}/><button type="button" className="icon-button" disabled={q.options.length <= 2} aria-label={`Xóa lựa chọn ${oi + 1} của câu ${index + 1}`} onClick={() => update(index, { options: q.options.filter((_, j) => j !== oi) })}>×</button></div>)}<button type="button" className="text-button" disabled={q.options.length >= 30} onClick={() => update(index, { options: [...q.options, { label: "", value: crypto.randomUUID() }] })}>＋ Thêm lựa chọn</button></div>}
          {q.type === "TEXT" && <p className="notice">Người trả lời được nhập tối đa 2.000 ký tự. Không yêu cầu thông tin nhận diện cá nhân.</p>}
          <label className="option"><input type="checkbox" checked={q.required} onChange={e => update(index, { required: e.target.checked })}/>Bắt buộc trả lời</label>
        </section>)}
        {!preview && <div className="drop-zone" onDragOver={e => e.preventDefault()} onDrop={e => drop(e, questions.length)}><strong>{questions.length ? "Thêm câu hỏi tiếp theo" : "Bắt đầu từ câu hỏi đầu tiên"}</strong><p>Kéo loại câu hỏi vào đây hoặc chọn trong thư viện bên trái.</p></div>}
      </div>
    </div>
  </form>;
}
