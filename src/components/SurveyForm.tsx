"use client";

import { startTransition, useActionState, useState } from "react";
import {answerProgress} from "@/modules/response/progress";
import {surveySections} from "@/modules/response/sections";
import {answersFrom,validateAnswers} from "@/modules/response/rules";
import { saveDraftAction, submitAction } from "@/app/student/actions";
import { QuestionFields } from "./QuestionFields";

type Question = { id: string; sectionTitle?: string; courseId?:string|null;lecturerId?:string|null;content: string; type: "SINGLE" | "MULTIPLE" | "SCALE" | "TEXT"; required: boolean; scaleMin: number; scaleMax: number; scaleStep: number; options: { id: string; label: string; value: string }[] };

export function SurveyForm({ campaignId, questions, draft }: { campaignId: string; questions: Question[]; draft: Record<string, string | string[]> }) {
  const [dirty,setDirty]=useState(false);
  const [answers,setAnswers]=useState(draft);
  const sections=surveySections(questions);
  const [active,setActive]=useState(()=>Math.max(0,sections.findIndex(s=>answerProgress(s.questions,draft).remainingRequired>0)));
  const [errors,setErrors]=useState<Record<string,string>>({});
  const progress=answerProgress(questions,answers);
  const [saveMessage, save, saving] = useActionState(async(previous:string|undefined,data:FormData)=>{const result=await saveDraftAction(previous,data);if(result.startsWith("Đã "))setDirty(false);return result;}, undefined);
  const [submitError, submit, submitting] = useActionState(submitAction, undefined);
  return <form className="card student-survey" method="post" noValidate onChange={event=>{
    if(!(event.target as HTMLInputElement).name?.startsWith("q_"))return;
    setAnswers(answersFrom(new FormData(event.currentTarget)));setDirty(true);setErrors({});
  }} onSubmit={event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if(button?.value!=="save"){
      const invalid=validateAnswers(questions.map(q=>({...q,optionValues:q.options.map(o=>o.value)})),answersFrom(data));
      setErrors(invalid);
      const first=questions.find(q=>invalid[q.id]);
      if(first){setActive(sections.findIndex(s=>s.questions.some(q=>q.id===first.id)));requestAnimationFrame(()=>document.getElementById(`question-${first.id}`)?.focus());return;}
    }
    startTransition(() => { if (button?.value === "save") save(data); else submit(data); });
  }}>
    <input type="hidden" name="campaignId" value={campaignId}/>
    <div className="survey-progress"><div className="section-heading"><strong aria-live="polite">Đã điền {progress.answered}/{questions.length} câu</strong><span className="muted">{progress.remainingRequired?`Còn ${progress.remainingRequired} câu bắt buộc`:"Đã điền đủ câu bắt buộc"}</span></div><progress max={Math.max(1,questions.length)} value={progress.answered} aria-label="Tiến độ điền khảo sát"/><small className="muted">{dirty?"Có thay đổi chưa lưu. ":""}Bấm Lưu bản nháp để lưu và quay lại sau. Bài đã gửi không thể chỉnh sửa.</small></div>
    {sections.length>1&&<nav className="survey-sections" aria-label="Các phần khảo sát">{sections.map((section,index)=>{const p=answerProgress(section.questions,answers);return <button type="button" className={index===active?"is-active":""} aria-current={index===active?"step":undefined} aria-controls={`survey-section-${index}`} key={section.id} disabled={saving||submitting} onClick={()=>setActive(index)}><span className="survey-step-number">{index+1}</span><span><strong>{section.title}</strong><small>{p.answered}/{section.questions.length} câu đã điền · {p.remainingRequired?`Còn ${p.remainingRequired} bắt buộc`:"Đủ câu bắt buộc"}</small></span></button>;})}</nav>}
    {sections.length>1&&<label className="field survey-section-select">Chuyển phần khảo sát<select className="input" value={active} disabled={saving||submitting} onChange={e=>setActive(Number(e.target.value))}>{sections.map((s,i)=><option key={s.id} value={i}>{i+1}. {s.title} · {answerProgress(s.questions,answers).answered}/{s.questions.length} câu</option>)}</select></label>}
    {sections.map((section,index)=><section id={`survey-section-${index}`} key={section.id} hidden={active!==index} className="survey-section-panel" aria-label={section.title}>
      <header className="survey-section-heading"><p className="eyebrow">Phần {index+1}/{sections.length} · {section.kind}</p><h2>{section.title}</h2><p className="muted">{section.kind==="Đánh giá giảng viên"?"Chỉ nhận xét việc giảng dạy của người được nêu ở trên trong môn này. Không đánh giá thay cho giảng viên khác.":section.kind==="Đánh giá môn học"?"Nhận xét nội dung, tổ chức và trải nghiệm học môn này. Đây là đánh giá chung của môn, không phải điểm đánh giá cá nhân giảng viên.":"Trả lời một lần cho toàn bộ phiếu. Không ghi tên, mã sinh viên hoặc thông tin nhận diện trong góp ý."}</p></header>
      {section.questions.map((question,i)=><fieldset id={`question-${question.id}`} tabIndex={-1} className="question" key={question.id} disabled={saving||submitting} aria-describedby={errors[question.id]?`error-${question.id}`:undefined}><legend><strong>{i+1}. {question.content}</strong>{question.required?<span className="error"> *</span>:<span className="muted"> · Không bắt buộc</span>}</legend><QuestionFields question={question} name={`q_${question.id}`} value={draft[question.id]}/>{errors[question.id]&&<p className="error" id={`error-${question.id}`}>{errors[question.id]}</p>}</fieldset>)}
    </section>)}
    {Object.keys(errors).length>0&&<p className="error" role="alert">Còn câu trả lời thiếu hoặc chưa hợp lệ. Đã mở phần cần kiểm tra đầu tiên.</p>}
    {sections.length>1&&<div className="survey-step-actions"><button className="button secondary" type="button" disabled={active===0||saving||submitting} onClick={()=>setActive(active-1)}>← Phần trước</button><span className="muted">Phần {active+1}/{sections.length}</span><button className="button secondary" type="button" disabled={active===sections.length-1||saving||submitting} onClick={()=>setActive(active+1)}>Phần tiếp theo →</button></div>}
    {(saveMessage || submitError) && <p className={submitError ? "error" : "notice"} role="status">{submitError ?? saveMessage}</p>}
    <p className="muted survey-submit-note">Gửi phản hồi sẽ nộp tất cả các phần của phiếu một lần. Bạn có thể lưu bản nháp nếu chưa làm xong.</p>
    <div className="actions"><button className="button secondary" name="intent" value="save" disabled={saving || submitting} formNoValidate>{saving ? "Đang lưu…" : "Lưu bản nháp"}</button><button className="button" name="intent" value="submit" disabled={saving || submitting}>{submitting ? "Đang gửi…" : "Gửi phản hồi"}</button></div>
  </form>;
}
