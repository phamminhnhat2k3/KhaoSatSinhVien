import { z } from "zod";

export type SurveyQuestion = { id: string; type: "SINGLE" | "MULTIPLE" | "SCALE" | "TEXT"; required: boolean; optionValues?: string[] };
export type SurveyAnswers = Record<string, string | string[]>;

export function validateAnswers(questions: SurveyQuestion[], answers: SurveyAnswers) {
  const errors: Record<string, string> = {};
  for (const question of questions) {
    const answer = answers[question.id];
    if (question.required && (answer == null || answer === "" || (Array.isArray(answer) && answer.length === 0))) {
      errors[question.id] = "Vui lòng trả lời câu hỏi này.";
      continue;
    }
    if (answer == null || answer === "") continue;
    if (question.type === "MULTIPLE") {
      if (!Array.isArray(answer) || answer.some((value) => !question.optionValues?.includes(value))) errors[question.id] = "Lựa chọn không hợp lệ.";
    } else if (Array.isArray(answer)) errors[question.id] = "Câu trả lời không hợp lệ.";
    else if (question.type === "SCALE" && !z.coerce.number().int().min(1).max(5).safeParse(answer).success) errors[question.id] = "Thang điểm phải từ 1 đến 5.";
    else if (question.type === "SINGLE" && !question.optionValues?.includes(answer)) errors[question.id] = "Lựa chọn không hợp lệ.";
    else if (question.type === "TEXT" && answer.length > 2000) errors[question.id] = "Phản hồi tối đa 2.000 ký tự.";
  }
  return errors;
}
