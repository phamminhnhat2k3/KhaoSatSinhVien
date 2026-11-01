"use client";

import { startTransition, useActionState, useState } from "react";
import {answerProgress} from "@/modules/response/progress";
import { saveDraftAction, submitAction } from "@/app/student/actions";
import { QuestionFields } from "./QuestionFields";

type Question = { id: string; sectionTitle?: string; content: string; type: "SINGLE" | "MULTIPLE" | "SCALE" | "TEXT"; required: boolean; scaleMin: number; scaleMax: number; scaleStep: number; options: { id: string; label: string; value: string }[] };

export function SurveyForm({ campaignId, questions, draft }: { campaignId: string; questions: Question[]; draft: Record<string, string | string[]> }) {
  const [dirty,setDirty]=useState(false);
  const [progress,setProgress]=useState(()=>answerProgress(questions,draft));
  const [saveMessage, save, saving] = useActionState(async(previous:string|undefined,data:FormData)=>{const result=await saveDraftAction(previous,data);if(result.startsWith("Đã "))setDirty(false);return result;}, undefined);
  const [submitError, submit, submitting] = useActionState(submitAction, undefined);
  return <form className="card student-survey" method="post" onChange={event=>{
    const data=new FormData(event.currentTarget);
    setProgress(answerProgress(questions,Object.fromEntries(questions.map(q=>[q.id,q.type==="MULTIPLE"?data.getAll(`q_${q.id}[]`).map(String):String(data.get(`q_${q.id}`)??"")]))));setDirty(true);
  }} onSubmit={event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    startTransition(() => { if (button?.value === "save") save(data); else submit(data); });
  }}>
    <input type="hidden" name="campaignId" value={campaignId}/>
    <div className="survey-progress"><div className="section-heading"><strong aria-live="polite">Đã điền {progress.answered}/{questions.length} câu</strong><span className="muted">{progress.remainingRequired?`Còn ${progress.remainingRequired} câu bắt buộc`:"Đã điền đủ câu bắt buộc"}</span></div><progress max={Math.max(1,questions.length)} value={progress.answered} aria-label="Tiến độ điền khảo sát"/><small className="muted">{dirty?"Có thay đổi chưa lưu. ":""}Bấm Lưu bản nháp để lưu và quay lại sau. Bài đã gửi không thể chỉnh sửa.</small></div>
    {questions.map((question, index) => <fieldset className="question" key={question.id} disabled={saving||submitting}><legend>{question.sectionTitle && <span className="pill">{question.sectionTitle}</span>}<br/><strong>{index + 1}. {question.content}</strong>{question.required && <span className="error"> *</span>}</legend>
      <QuestionFields question={question} name={`q_${question.id}`} value={draft[question.id]}/>
    </fieldset>)}
    {(saveMessage || submitError) && <p className={submitError ? "error" : "notice"} role="status">{submitError ?? saveMessage}</p>}
    <div className="actions"><button className="button secondary" name="intent" value="save" disabled={saving || submitting}>{saving ? "Đang lưu…" : "Lưu bản nháp"}</button><button className="button" name="intent" value="submit" disabled={saving || submitting}>{submitting ? "Đang gửi…" : "Gửi phản hồi"}</button></div>
  </form>;
}
