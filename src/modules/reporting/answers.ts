import type { Prisma } from "@prisma/client";

export function displayAnswer(question: { type: string; scaleMin: number; scaleMax: number; options: { value: string; label: string }[] }, value: Prisma.JsonValue | undefined) {
  if (value == null || value === "" || Array.isArray(value) && !value.length) return "Không trả lời";
  if (question.type === "SCALE") return `${String(value)} điểm · Thang ${question.scaleMin}–${question.scaleMax}`;
  if (question.type === "SINGLE" || question.type === "MULTIPLE") return (Array.isArray(value) ? value : [value]).map(item => question.options.find(o => o.value === String(item))?.label ?? String(item)).join("; ");
  return typeof value === "string" ? value : JSON.stringify(value);
}
