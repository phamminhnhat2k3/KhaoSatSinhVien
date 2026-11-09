"use client";
import { useState } from "react";
import { participationRate } from "@/modules/reporting/report";
import styles from "./CampaignProgress.module.css";

export function CampaignProgress({ invited, completed, drafts, groups }: { invited: number; completed: number; drafts: number; groups: { id: string; title: string; invited: number; completed: number; drafts: number; rate: number }[] }) {
  const [q, setQ] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const rate = participationRate(completed, invited), draftRate = participationRate(drafts, invited);
  const waiting = Math.max(0, invited - completed - drafts);
  const visible = groups.filter(g => (!pendingOnly || g.completed < g.invited) && g.title.toLocaleLowerCase("vi").includes(q.trim().toLocaleLowerCase("vi")));
  return <section aria-label="Tiến độ khảo sát">
    <div className={styles.overview}>
      <article className={`card ${styles.chart}`}><h2>Tỷ lệ hoàn thành</h2><div className={styles.donut} role="img" aria-label={`${completed}/${invited} hoàn thành, ${drafts} đang làm, ${waiting} chưa bắt đầu`} style={{ background: `conic-gradient(#087f68 0 ${rate}%, #e4a836 ${rate}% ${rate + draftRate}%, #dce4eb ${rate + draftRate}% 100%)` }}><div className={styles.center}><strong>{rate}%</strong><span>{completed}/{invited} phiếu</span></div></div><div className={styles.legend}><span>Đã gửi</span><span>Đang làm</span><span>Chưa bắt đầu</span></div></article>
      <div className={styles.metrics}>{[["Được giao phiếu", invited, "Số sinh viên nhận khảo sát"], ["Đã hoàn thành", completed, "Đã gửi và không sửa lại"], ["Đang làm", drafts, "Đã lưu bản nháp"], ["Chưa bắt đầu", waiting, "Chưa lưu nháp hoặc gửi phiếu"]].map(([title, count, note]) => <article className="card" key={title}><span className="muted">{title}</span><strong>{count}</strong><small className="muted">{note}</small></article>)}</div>
    </div>
    <section className="card section-title"><h2>Tiến độ theo lớp hành chính</h2><p className="muted">Xếp lớp có tỷ lệ hoàn thành thấp trước. Phân nhóm theo lớp hiện tại của sinh viên, chỉ theo dõi trạng thái, không liên kết với câu trả lời.</p>
      <div className={styles.toolbar}><label className="field">Tìm lớp hoặc khoa<input className="input" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Nhập mã lớp hoặc tên khoa"/></label><label className="option"><input type="checkbox" checked={pendingOnly} onChange={e => setPendingOnly(e.target.checked)}/>Chỉ lớp chưa hoàn thành</label></div>
      <div className={styles.groups}>{visible.map(g => <article key={g.id}><div className="section-heading"><h3>{g.title}</h3><strong>{g.rate}%</strong></div><div className={styles.bar} role="progressbar" aria-label={`Hoàn thành ${g.title}`} aria-valuemin={0} aria-valuemax={g.invited} aria-valuenow={g.completed}><span style={{ width: `${g.rate}%` }}/></div><p className="muted">{g.completed}/{g.invited} đã gửi · {g.drafts} đang làm · {g.invited - g.completed} chưa hoàn thành</p></article>)}{!visible.length && <p className="notice">{groups.length ? "Không có lớp phù hợp bộ lọc." : "Chưa giao phiếu cho sinh viên."}</p>}</div>
    </section>
  </section>;
}
