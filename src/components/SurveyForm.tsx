"use client";

import { useActionState } from "react";
import { saveDraftAction, submitAction } from "@/app/student/actions";
import { QuestionFields } from "./QuestionFields";

type Question = { id: string; content: string; type: "SINGLE" | "MULTIPLE" | "SCALE" | "TEXT"; required: boolean; scaleMin: number; scaleMax: number; scaleStep: number; options: { id: string; label: string; value: string }[] };

export function SurveyForm({ campaignId, questions, draft }: { campaignId: string; questions: Question[]; draft: Record<string, string | string[]> }) {
  const [saveMessage, save, saving] = useActionState(saveDraftAction, undefined);
  const [submitError, submit, submitting] = useActionState(submitAction, undefined);
  return <form className="card" action={submit}>
    <input type="hidden" name="campaignId" value={campaignId}/>
    {questions.map((question, index) => <fieldset className="question" key={question.id}><legend><strong>{index + 1}. {question.content}</strong>{question.required && <span className="error"> *</span>}</legend>
      <QuestionFields question={question} name={`q_${question.id}`} value={draft[question.id]}/>
    </fieldset>)}
    {(saveMessage || submitError) && <p className={submitError ? "error" : "notice"} role="status">{submitError ?? saveMessage}</p>}
    <div className="actions"><button className="button secondary" formAction={save} disabled={saving || submitting}>{saving ? "Đang lưu…" : "Lưu bản nháp"}</button><button className="button" disabled={saving || submitting}>{submitting ? "Đang gửi…" : "Gửi phản hồi"}</button></div>
  </form>;
}
