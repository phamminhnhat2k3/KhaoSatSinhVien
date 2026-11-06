import { beforeEach, expect, test, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), user: vi.fn(), evaluations: vi.fn() }));
vi.mock("@/auth", () => ({ auth: m.auth }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: m.user } } }));
vi.mock("@/modules/reporting/entity-evaluations", () => ({ getEntityEvaluations: m.evaluations }));
import { GET } from "./route";
beforeEach(() => { vi.resetAllMocks(); m.auth.mockResolvedValue({ user: { id: "admin" } }); m.user.mockResolvedValue({ active: true, roles: [{ role: "ADMIN" }] }); });
test("chỉ Admin đang hoạt động được xem", async () => {
  for (const actor of [null, { active: false, roles: [{ role: "ADMIN" }] }, { active: true, roles: [{ role: "STUDENT" }] }, { active: true, roles: [{ role: "LECTURER" }, { role: "DEAN" }] }]) {
    m.user.mockResolvedValue(actor);
    expect((await GET(new Request("http://test/api/admin/details/evaluations?type=user&id=u"))).status).toBe(403);
  }
  expect(m.evaluations).not.toHaveBeenCalled();
});
test("kiểm tra tham số và không lưu cache dữ liệu riêng tư", async () => {
  for (const query of ["type=bad&id=u", "type=user", "type=user&id=u&page=0", "type=user&id=u&page=1.5"]) expect((await GET(new Request(`http://test/api/admin/details/evaluations?${query}`))).status).toBe(400);
  m.evaluations.mockResolvedValue({ kind: "student", total: 1, items: [] });
  const response = await GET(new Request("http://test/api/admin/details/evaluations?type=user&id=u&page=2"));
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(m.evaluations).toHaveBeenCalledWith(expect.anything(), "user", "u", 2, undefined);
});
test("chưa đủ điều kiện báo cáo trả thông báo, không trả nội dung", async () => {
  m.evaluations.mockRejectedValue(new Error("Báo cáo chỉ có sau khi khảo sát đóng hoặc hết hạn."));
  const response = await GET(new Request("http://test/api/admin/details/evaluations?type=user&id=u&campaignId=c"));
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "Báo cáo chỉ có sau khi khảo sát đóng hoặc hết hạn." });
});
