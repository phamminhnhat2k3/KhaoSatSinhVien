import { z } from "zod";

const identifier = z.string().max(150);
const date = z.union([z.literal(""), z.iso.date()]);
const schema = z.object({ title: z.string().max(120), scope: z.enum(["FACULTY", "UNIVERSITY"]), facultyId: identifier, semesterId: identifier, templateId: identifier, courseTemplateId: identifier, courseIds: z.array(identifier).max(200), academicClassIds: z.array(identifier).max(200), startsAt: date, endsAt: date, evaluationMode: z.enum(["COURSE", "LECTURER"]).optional() });
export function readCampaignDraft(raw: string | null) {
  try { const result = schema.safeParse(JSON.parse(raw ?? "null")); return result.success ? result.data : null; } catch { return null; }
}
export function campaignDraftFromForm(form: FormData) {
  return schema.parse(Object.fromEntries([
    ...["title", "scope", "facultyId", "semesterId", "templateId", "courseTemplateId", "startsAt", "endsAt"].map(key => [key, String(form.get(key) ?? "")]),
    ["courseIds", form.getAll("courseIds").map(String)], ["academicClassIds", form.getAll("academicClassIds").map(String)], ["evaluationMode", String(form.get("evaluationMode") ?? "LECTURER")],
  ]));
}
