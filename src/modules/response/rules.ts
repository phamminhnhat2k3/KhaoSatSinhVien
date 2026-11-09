export type SurveyQuestion = { id: string; type: "SINGLE" | "MULTIPLE" | "SCALE" | "TEXT"; required: boolean; optionValues?: string[]; scaleMin?: number; scaleMax?: number; scaleStep?: number };
export type SurveyAnswers = Record<string, string | string[]>;

export function validateAnswers(questions: SurveyQuestion[], answers: SurveyAnswers) {
  const errors: Record<string, string> = {};
  for (const id of Object.keys(answers)) if (!questions.some(q => q.id === id)) errors[id] = "Câu hỏi không thuộc mẫu khảo sát.";
  for (const question of questions) {
    const answer = answers[question.id];
    if (question.required && (answer == null || typeof answer === "string" && !answer.trim() || (Array.isArray(answer) && answer.length === 0))) {
      errors[question.id] = "Vui lòng trả lời câu hỏi này.";
      continue;
    }
    if (answer == null || answer === "") continue;
    if (question.type === "MULTIPLE") {
      if (!Array.isArray(answer) || answer.some((value) => !question.optionValues?.includes(value))) errors[question.id] = "Lựa chọn không hợp lệ.";
    } else if (Array.isArray(answer)) errors[question.id] = "Câu trả lời không hợp lệ.";
    else if (question.type === "SCALE") {
      const n = Number(answer), min = question.scaleMin ?? 1, max = question.scaleMax ?? 5, step = question.scaleStep ?? 1;
      if (!answer.trim() || !Number.isInteger(n) || n < min || n > max || (n - min) % step !== 0) errors[question.id] = `Điểm phải từ ${min} đến ${max}, theo bước ${step}.`;
    }
    else if (question.type === "SINGLE" && !question.optionValues?.includes(answer)) errors[question.id] = "Lựa chọn không hợp lệ.";
    else if (question.type === "TEXT" && answer.length > 2000) errors[question.id] = "Phản hồi tối đa 2.000 ký tự.";
  }
  return errors;
}

export function answersFrom(formData: FormData): SurveyAnswers {
  const result: SurveyAnswers = {};
  for (const key of new Set([...formData.keys()].filter(key => key.startsWith("q_")))) {
    const values = formData.getAll(key).map(String);
    result[key.slice(2).replace(/\[\]$/, "")] = key.endsWith("[]") || values.length > 1 ? values : values[0];
  }
  return result;
}
