import { db } from "@/lib/db";
import { templateSchema } from "./rules";

export async function saveTemplate(actorId: string, input: unknown) {
  const data = templateSchema.parse(input);
  return db.$transaction(async tx => {
    const template = await tx.surveyTemplate.create({ data: { title: data.title, questions: { create: data.questions.map((q, position) => ({ ...q, position: position + 1, options: { create: q.options.map((o, index) => ({ ...o, position: index + 1 })) } })) } } });
    await tx.auditLog.create({ data: { actorId, action: "CREATE", entity: "SurveyTemplate", entityId: template.id } });
    return template;
  });
}
