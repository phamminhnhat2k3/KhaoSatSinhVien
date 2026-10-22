import { z } from "zod";

export const questionTypes = { SCALE: "Thang điểm", SINGLE: "Một lựa chọn", MULTIPLE: "Nhiều lựa chọn", TEXT: "Tự luận" } as const;
export const templateSchema = z.object({
  title: z.string().trim().min(3, "Tên mẫu cần ít nhất 3 ký tự.").max(120),
  questions: z.array(z.object({
    content: z.string().trim().min(3, "Nội dung câu hỏi cần ít nhất 3 ký tự.").max(1000),
    type: z.enum(["SCALE", "SINGLE", "MULTIPLE", "TEXT"]),
    required: z.boolean(),
    scaleMin: z.number().int().min(0).max(999).default(1),
    scaleMax: z.number().int().min(1).max(1000).default(5),
    scaleStep: z.number().int().min(1).max(1000).default(1),
    options: z.array(z.object({ label: z.string().trim().min(1, "Lựa chọn không được để trống.").max(200), value: z.string().min(1).max(100) })).max(30).default([])
  }).superRefine((q, ctx) => {
    if (q.type === "SCALE" && (q.scaleMax <= q.scaleMin || (q.scaleMax - q.scaleMin) % q.scaleStep !== 0)) ctx.addIssue({ code: "custom", path: ["scaleMax"], message: "Thang điểm phải tăng dần và chia hết theo bước nhảy." });
    if (q.type === "SINGLE" || q.type === "MULTIPLE") {
      if (q.options.length < 2) ctx.addIssue({ code: "custom", path: ["options"], message: "Cần ít nhất 2 lựa chọn." });
      if (new Set(q.options.map(o => o.label.toLocaleLowerCase("vi"))).size !== q.options.length || new Set(q.options.map(o => o.value)).size !== q.options.length) ctx.addIssue({ code: "custom", path: ["options"], message: "Các lựa chọn không được trùng nhau." });
    } else if (q.options.length) ctx.addIssue({ code: "custom", path: ["options"], message: "Loại câu hỏi này không dùng danh sách lựa chọn." });
  })).min(1, "Thêm ít nhất một câu hỏi.").max(100, "Mỗi mẫu tối đa 100 câu hỏi.")
});
export type TemplateInput = z.infer<typeof templateSchema>;
export type QuestionInput = TemplateInput["questions"][number];

export function newQuestion(type: QuestionInput["type"]): QuestionInput {
  return { type, content: "", required: true, scaleMin: 1, scaleMax: 5, scaleStep: 1, options: type === "SINGLE" || type === "MULTIPLE" ? [{ label: "", value: "1" }, { label: "", value: "2" }] : [] };
}

export function moveQuestion<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length) return items;
  const next = [...items];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}
