"use client";

import { useActionState } from "react";
import { createTemplate } from "@/app/admin/actions";

export function TemplateForm() {
  const [error, action, pending] = useActionState(createTemplate, undefined);
  return <form action={action} className="stack">
    <label className="field">Tên mẫu<input className="input" name="title" required defaultValue="Đánh giá học phần" /></label>
    <label className="field">Câu thang điểm<input className="input" name="scale" required defaultValue="Bạn hài lòng với học phần ở mức nào?" /></label>
    <label className="field">Câu một lựa chọn<input className="input" name="single" required defaultValue="Hình thức học tập hiệu quả nhất?" /></label>
    <label className="field">Câu nhiều lựa chọn<input className="input" name="multiple" required defaultValue="Những điểm bạn đánh giá cao?" /></label>
    <label className="field">Câu tự luận<input className="input" name="text" required defaultValue="Đề xuất cải tiến cho học phần" /></label>
    {error && <p className="error" role="alert">{error}</p>}<button className="button" disabled={pending}>{pending ? "Đang tạo…" : "Tạo mẫu 4 loại câu hỏi"}</button>
  </form>;
}
