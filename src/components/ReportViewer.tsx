"use client";
import {useState} from "react";
import type {getCampaignReport} from "@/modules/reporting/service";
type Report=Awaited<ReturnType<typeof getCampaignReport>>;
export function ReportViewer({report}:{report:Report}){
 const [section,setSection]=useState("all");
 const sections=report.sections;
 const questions=report.questions.filter(q=>section==="all"||q.sectionId===section);
 return <section id="ket-qua" className="role-section report-viewer" aria-label="Báo cáo tổng hợp"><div className="section-heading"><div><p className="eyebrow">Báo cáo tổng hợp</p><h2>{report.title}</h2><p className="muted">Chỉ hiển thị dữ liệu trong phạm vi bạn được xem.</p></div><a className="button secondary" href={`/api/reports/campaigns/${report.id}/export`}>Xuất CSV</a></div>
 <div className="role-stats"><article className="card"><span className="muted">Tỷ lệ tham gia</span><strong>{report.participationRate}%</strong><small>{report.completed}/{report.invited} sinh viên được giao</small></article><article className="card"><span className="muted">Phản hồi ẩn danh</span><strong>{report.responses}</strong><small>Số bài trong phạm vi báo cáo</small></article></div>
 <p className="notice">{report.evaluationMode==="LECTURER"?"Kết quả được tách theo từng môn và từng giảng viên. Điểm của hai người cùng dạy không được gộp chung.":"Đây là phản hồi về chất lượng môn học hoặc nội dung chung, không phải điểm đánh giá cá nhân giảng viên."}</p>
 <label className="field report-section-filter">Phần đánh giá<select className="input" value={section} onChange={e=>setSection(e.target.value)}><option value="all">Tất cả các phần</option>{sections.map(s=><option key={s.id} value={s.id}>{s.title}{s.responses<report.minimum?" · Chưa đủ phản hồi":""}</option>)}</select></label>
 {sections.filter(s=>(section==="all"||section===s.id)&&s.responses<report.minimum).map(s=><article className="card report-pending" key={s.id}><h3>{s.title}</h3><p className="muted">Chưa đủ tối thiểu {report.minimum} phản hồi để mở phần này. Không hiển thị điểm hoặc góp ý.</p></article>)}
 <div className="stack">{questions.map(q=><article className="card report-question" key={q.id}><p className="eyebrow">{q.sectionTitle}</p><h3>{q.content.startsWith(`${q.sectionTitle} — `)?q.content.slice(`${q.sectionTitle} — `.length):q.content}</h3><p className="muted">{q.respondents}/{q.invited} người được giao đã trả lời câu này.</p>{q.suppressed?<p className="notice">Chưa đủ phản hồi để hiển thị kết quả câu này.</p>:<>
 {q.average!==undefined&&<p className="report-score"><strong>{q.average}</strong> / {q.scaleMax}<small>Thang {q.scaleMin}–{q.scaleMax}</small></p>}
 {q.distribution&&<div className="report-distribution" aria-label="Phân bố lựa chọn">{q.distribution.map(item=><div key={item.label}><div className="section-heading"><span>{item.label}</span><strong>{item.count} lượt</strong></div><div className="report-bar" aria-hidden="true"><span style={{width:`${item.count/Math.max(1,...q.distribution!.map(d=>d.count))*100}%`}}/></div></div>)}</div>}
 {q.comments?.map((comment,index)=><blockquote className="report-comment" key={index}>{comment}</blockquote>)}
 {q.comments&&!q.comments.length&&<p className="muted">Chưa có góp ý cho câu này.</p>}
 </>}</article>)}</div><p className="muted report-footnote">Câu bỏ trống không được tính là đã trả lời. Xuất CSV lấy toàn bộ báo cáo trong phạm vi của bạn, không phụ thuộc phần đang lọc.</p></section>;
}
