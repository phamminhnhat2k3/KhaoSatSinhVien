"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/access";
import { importColumns, type ImportKind } from "@/modules/academic/import-csv";
import { commitImport, previewImport } from "@/modules/academic/import-service";
import { importFileText } from "@/modules/academic/import-excel";
export type ImportState = { ok: boolean; message: string; rows?: { line: number; values: string[]; error: string }[]; valid?: boolean; done?: boolean };
export async function importData(_: ImportState, form: FormData): Promise<ImportState> {
  const actor = await requireUser("ADMIN");
  const kind = String(form.get("kind")) as ImportKind;
  if (!Object.hasOwn(importColumns, kind)) return { ok: false, message: "Loại dữ liệu không hợp lệ." };
  const file = form.get("file");
  if (!(file instanceof File) || !file.size || file.size > 200000) return { ok: false, message: "Chọn tệp CSV UTF-8 hoặc XLSX không quá 200 KB." };
  try {
    const raw = await importFileText(file);
    const apply = form.get("intent") === "apply";
    if (apply && form.get("confirm") !== "yes") return { ok: false, message: "Xác nhận đã kiểm tra toàn bộ dữ liệu trước khi nhập." };
    const result = apply ? await commitImport(db, actor.id, kind, raw, String(form.get("password") ?? "")) : await previewImport(db, kind, raw);
    if (apply && result.valid) { for (const p of ["/admin/users", "/admin/lecturers", "/admin/assignments"]) revalidatePath(p); }
    return { ok: result.valid, message: result.valid ? apply ? `Đã nhập thành công ${result.rows.length} dòng. Không ghi đè tài khoản cũ.` : `Đã kiểm tra ${result.rows.length} dòng. Chưa ghi dữ liệu.` : "Có dòng chưa hợp lệ. Chưa ghi bất kỳ dữ liệu nào.", rows: result.rows.map(r => ({ line: r.line, values: r.values, error: r.error })), valid: result.valid, done: apply && result.valid };
  } catch (error) { return { ok: false, message: `${error instanceof Error && /^(Chỉ nhận|Tệp nhập|Tối đa|Không nhận|Tệp Excel|Chọn CSV)/.test(error.message) ? error.message : "Không nhập được. Kiểm tra CSV UTF-8 hoặc XLSX, tiêu đề, mật khẩu và dữ liệu trùng."} Chưa nhập một phần, hãy xem trước lại.` }; }
}
