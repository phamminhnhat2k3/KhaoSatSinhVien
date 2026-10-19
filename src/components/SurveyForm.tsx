"use client";

import { useActionState } from "react";
import { saveDraftAction, submitAction } from "@/app/student/actions";

type Question = { id: string; content: string; type: "SINGLE" | "MULTIPLE" | "SCALE" | "TEXT"; required: boolean; options: { id: string; label: string; value: string }[] };

export function SurveyForm({ campaignId, questions, draft }: { campaignId: string; questions: Question[]; draft: Record<string, string | string[]> }) {
  const [saveMessage, save, saving] = useActionState(saveDraftAction, undefined);
  const [submitError, submit, submitting] = useActionState(submitAction, undefined);
  return <form className="card" action={submit}>
    <input type="hidden" name="campaignId" value={campaignId}/>
    {questions.map((question, index) => <fieldset className="question" key={question.id}><legend><strong>{index + 1}. {question.content}</strong>{question.required && <span className="error"> *</span>}</legend>
      {question.type === "TEXT" ? <><textarea className="input" name={`q_${question.id}`} rows={4} maxLength={2000} defaultValue={String(draft[question.id] ?? "")} /><small className="muted">Không nhập họ tên, mã sinh viên hoặc thông tin tự nhận diện.</small></> : question.type === "SCALE" ? <div className="actions">{[1,2,3,4,5].map((value) => <label className="option" key={value}><input type="radio" name={`q_${question.id}`} value={value} defaultChecked={draft[question.id] === String(value)}/>{value}</label>)}</div> : question.options.map((option) => <label className="option" key={option.id}><input type={question.type === "MULTIPLE" ? "checkbox" : "radio"} name={`q_${question.id}`} value={option.value} defaultChecked={Array.isArray(draft[question.id]) ? draft[question.id].includes(option.value) : draft[question.id] === option.value}/>{option.label}</label>)}
    </fieldset>)}
    {(saveMessage || submitError) && <p className={submitError ? "error" : "notice"} role="status">{submitError ?? saveMessage}</p>}
    <div className="actions"><button className="button secondary" formAction={save} disabled={saving || submitting}>{saving ? "Đang lưu…" : "Lưu bản nháp"}</button><button className="button" disabled={saving || submitting}>{submitting ? "Đang gửi…" : "Gửi phản hồi"}</button></div>
  </form>;
}
