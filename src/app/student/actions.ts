"use server";

import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { saveDraft, submitResponse } from "@/modules/response/service";
import type { SurveyAnswers } from "@/modules/response/rules";

function answersFrom(formData: FormData) {
  const result: SurveyAnswers = {};
  for (const key of new Set([...formData.keys()].filter((key) => key.startsWith("q_")))) {
    const values = formData.getAll(key).map(String);
    result[key.slice(2)] = values.length > 1 ? values : values[0];
  }
  return result;
}

async function studentId() {
  const user = await requireUser(Role.STUDENT);
  const student = await db.studentProfile.findUnique({ where: { userId: user.id } });
  if (!student) throw new Error("Không tìm thấy hồ sơ sinh viên.");
  return student.id;
}

export async function saveDraftAction(_: string | undefined, formData: FormData) {
  try { await saveDraft(db, String(formData.get("campaignId")), await studentId(), answersFrom(formData)); return "Đã lưu bản nháp."; }
  catch (error) { return error instanceof Error ? error.message : "Không thể lưu bản nháp."; }
}

export async function submitAction(_: string | undefined, formData: FormData) {
  try { await submitResponse(db, String(formData.get("campaignId")), await studentId(), answersFrom(formData)); }
  catch (error) { return error instanceof Error ? error.message : "Không thể gửi phản hồi."; }
  redirect("/student?submitted=1");
}
