"use client";
import { useEffect, useRef, useState } from "react";
import type { getEntityEvaluations } from "@/modules/reporting/entity-evaluations";
import { ReportViewer } from "./ReportViewer";
import styles from "./EntityEvaluations.module.css";

type Data = Awaited<ReturnType<typeof getEntityEvaluations>>;
export function EntityEvaluations({ id, type }: { id: string; type: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [campaign, setCampaign] = useState("");
  const [retry, setRetry] = useState(0);
  const heading = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setData(null);
    const params = new URLSearchParams({ id, type, page: String(page), ...(campaign ? { campaignId: campaign } : {}) });
    void fetch(`/api/admin/details/evaluations?${params}`, { cache: "no-store", signal: controller.signal }).then(async response => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Không tải được đánh giá.");
      if (!controller.signal.aborted) setData(body);
    }).catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Không tải được đánh giá."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, type, page, campaign, retry]);
  function go(next: number, selected = "") { setPage(next); setCampaign(selected); heading.current?.scrollIntoView({ block: "start" }); }
  return <div className={styles.panel} ref={heading}>
    {campaign && <button type="button" className="text-button" onClick={() => go(page)}>← Danh sách đánh giá</button>}
    {loading ? <p role="status">Đang tải đánh giá…</p> : error ? <div role="alert"><p>{error}</p><button type="button" className="button secondary" onClick={() => setRetry(n => n + 1)}>Thử lại</button></div> : data && <>
      {data.kind === "other" ? <p>Tài khoản này không có lịch sử tham gia hoặc nhận đánh giá.</p> : data.report ? <ReportViewer key={data.report.id} report={data.report} embedded compact/> : <>
        <p className={styles.total}><strong>{data.total}</strong> {data.kind === "student" ? "phiếu đã gửi" : "đợt khảo sát liên quan"}</p>
        <p className="muted">{data.kind === "student" ? "Đây là lịch sử hoàn thành. Nội dung bài trả lời được lưu ẩn danh nên không gắn với sinh viên." : data.kind === "lecturer" ? "Các đợt đánh giá giảng viên thực dạy đã chốt khi công bố. Kết quả mở khi đợt kết thúc và đủ ngưỡng ẩn danh." : "Kết quả mở khi đợt kết thúc và đủ ngưỡng ẩn danh."}</p>
        {!data.items.length && <p>Chưa có {data.kind === "student" ? "phiếu đã gửi" : "đợt đánh giá liên quan"}.</p>}
        <ul className={styles.list}>{data.items.map(item => <li key={item.id}><h3>{item.title}</h3><p>{item.semester}</p><small>{item.detail}</small>{data.kind !== "student" && <button type="button" className="button secondary" onClick={() => go(data.page, item.id)}>Xem kết quả</button>}</li>)}</ul>
        {data.pages > 1 && <nav className={styles.pagination} aria-label="Phân trang đánh giá"><button type="button" disabled={data.page <= 1} onClick={() => go(data.page - 1)}>Trước</button><span>Trang {data.page}/{data.pages}</span><button type="button" disabled={data.page >= data.pages} onClick={() => go(data.page + 1)}>Sau</button></nav>}
      </>}
    </>}
  </div>;
}
