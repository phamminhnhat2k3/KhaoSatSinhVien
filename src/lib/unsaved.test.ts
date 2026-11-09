import { expect, test } from "vitest";
import { formSnapshot } from "./unsaved";

test("đối chiếu dữ liệu biểu mẫu bỏ trường nội bộ React và giữ các lựa chọn lặp", () => {
  const a = new FormData(), b = new FormData();
  a.set("$ACTION_ID_123", "internal"); a.set("name", "A"); a.append("ids", "one"); a.append("ids", "two");
  b.append("ids", "one"); b.append("ids", "two"); b.set("name", "A");
  expect(formSnapshot(a)).toBe(formSnapshot(b));
  b.set("name", "B"); expect(formSnapshot(a)).not.toBe(formSnapshot(b));
});
