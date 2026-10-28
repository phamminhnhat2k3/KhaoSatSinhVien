"use client";

import { startTransition, useActionState } from "react";
import { saveDraftAction, submitAction } from "@/app/student/actions";
import { QuestionFields } from "./QuestionFields";

type Question = { id: string; sectionTitle?: string; content: string; type: "SINGLE" | "MULTIPLE" | "SCALE" | "TEXT"; required: boolean; scaleMin: number; scaleMax: number; scaleStep: number; options: { id: string; label: string; value: string }[] };

export function SurveyForm({ campaignId, questions, draft }: { campaignId: string; questions: Question[]; draft: Record<string, string | string[]> }) {
  const [saveMessage, save, saving] = useActionState(saveDraftAction, undefined);
  const [submitError, submit, submitting] = useActionState(submitAction, undefined);
  return <form className="card" method="post" onSubmit={event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    startTransition(() => { if (button?.value === "save") save(data); else submit(data); });
  }}>
    <input type="hidden" name="campaignId" value={campaignId}/>
    {questions.map((question, index) => <fieldset className="question" key={question.id}><legend>{question.sectionTitle && <span className="pill">{question.sectionTitle}</span>}<br/><strong>{index + 1}. {question.content}</strong>{question.required && <span className="error"> *</span>}</legend>
      <QuestionFields question={question} name={`q_${question.id}`} value={draft[question.id]}/>
    </fieldset>)}
    {(saveMessage || submitError) && <p className={submitError ? "error" : "notice"} role="status">{submitError ?? saveMessage}</p>}
    <div className="actions"><button className="button secondary" name="intent" value="save" disabled={saving || submitting}>{saving ? "Đang lưu…" : "Lưu bản nháp"}</button><button className="button" name="intent" value="submit" disabled={saving || submitting}>{submitting ? "Đang gửi…" : "Gửi phản hồi"}</button></div>
  </form>;
}
