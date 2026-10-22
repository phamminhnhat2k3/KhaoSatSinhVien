import type { QuestionInput } from "@/modules/templates/rules";

export function QuestionFields({ question: q, name, value }: { question: Pick<QuestionInput, "type" | "options"> & Partial<Pick<QuestionInput, "scaleMin" | "scaleMax" | "scaleStep">>; name: string; value?: string | string[] }) {
  if (q.type === "TEXT") return <><textarea aria-label="Câu trả lời tự luận" className="input" name={name} rows={4} maxLength={2000} defaultValue={String(value ?? "")}/><small className="muted">Tối đa 2.000 ký tự. Không nhập thông tin tự nhận diện.</small></>;
  if (q.type === "SCALE") {
    const min = q.scaleMin ?? 1, max = q.scaleMax ?? 5, step = q.scaleStep ?? 1;
    const count = Math.floor((max - min) / step) + 1;
    return <div className="stack"><small className="muted">Thang điểm {min}–{max} · Bước nhảy {step}</small>{count > 0 && count <= 11 ? <div className="scale-options">{Array.from({ length: count }, (_, i) => min + i * step).map(n => <label key={n}><input type="radio" name={name} value={n} defaultChecked={value === String(n)}/><span>{n}</span></label>)}</div> : <input className="input" aria-label={`Điểm từ ${min} đến ${max}`} type="number" name={name} min={min} max={max} step={step} placeholder={`${min}–${max}`} defaultValue={String(value ?? "")}/>}</div>;
  }
  return <>{q.options.map(o => <label className="option" key={o.value}><input type={q.type === "MULTIPLE" ? "checkbox" : "radio"} name={q.type === "MULTIPLE" ? `${name}[]` : name} value={o.value} defaultChecked={Array.isArray(value) ? value.includes(o.value) : value === o.value}/>{o.label || "Nội dung lựa chọn"}</label>)}</>;
}
