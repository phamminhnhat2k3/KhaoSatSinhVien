import { expect, test } from "vitest";
import { actionFeedback, readActionFlash } from "./action-feedback";
test("phản hồi dùng trạng thái thật, không báo thành công khi lỗi", () => {
  expect(actionFeedback("Đã tạo khoa.")?.kind).toBe("success");
  expect(actionFeedback("Không lưu được.")?.kind).toBe("error");
  expect(actionFeedback({ ok: false, message: "Mật khẩu sai" })?.kind).toBe("error");
  expect(actionFeedback({ ok: true, message: "Lưu thành công" })?.kind).toBe("success");
  expect(actionFeedback(undefined)).toBeUndefined();
  expect(actionFeedback({ saved: true })).toBeUndefined();
});
test("đọc thông báo chuyển trang và bỏ qua cookie không hợp lệ", () => {
  const value = { id: "unique", message: "Đã tạo sinh viên.", kind: "success" };
  expect(readActionFlash(`other=1; action-feedback=${encodeURIComponent(JSON.stringify(value))}`)).toEqual(value);
  for (const cookie of ["", "action-feedback=%", "action-feedback=null", 'action-feedback={"id":"x","message":"x","kind":"bad"}']) expect(readActionFlash(cookie)).toBeUndefined();
});
