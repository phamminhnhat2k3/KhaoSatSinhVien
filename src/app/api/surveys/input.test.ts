import { beforeEach, expect, test, vi } from "vitest";
const m = vi.hoisted(() => ({ user: vi.fn(), student: vi.fn(), participation: vi.fn(), submit: vi.fn(), draft: vi.fn() }));
vi.mock("@/lib/access", () => ({ currentUser: m.user }));
vi.mock("@/lib/db", () => ({ db: { studentProfile: { findUnique: m.student, findUniqueOrThrow: m.student }, surveyParticipation: { findUnique: m.participation, findMany: m.participation } } }));
vi.mock("@/modules/response/service", () => ({ saveDraft: m.draft, submitResponse: m.submit }));
import { PUT } from "./[id]/draft/route";
import { POST } from "./[id]/submit/route";
import { GET as assigned } from "./assigned/route";
import { GET as survey } from "./[id]/route";
const params = () => ({ params: Promise.resolve({ id: "c" }) });
beforeEach(() => { vi.resetAllMocks(); m.user.mockResolvedValue({ id: "u", roles: ["STUDENT"] }); });
test("JSON sai định dạng trả 400, không chạy thao tác lưu hoặc gửi", async () => {
  const request = (method: string) => new Request("http://test/survey", { method, body: "{broken", headers: { "Content-Type": "application/json" } });
  expect((await PUT(request("PUT"), params())).status).toBe(400);
  expect((await POST(request("POST"), params())).status).toBe(400);
  expect(m.student).not.toHaveBeenCalled(); expect(m.submit).not.toHaveBeenCalled(); expect(m.draft).not.toHaveBeenCalled();
});
test("không đọc phiếu hoặc danh sách khi phiên bị khóa hoặc đã mất vai trò sinh viên", async () => {
  for (const user of [null, { id: "u", roles: ["LECTURER"] }]) {
    m.user.mockResolvedValue(user);
    expect((await assigned()).status).toBe(403);
    expect((await survey(new Request("http://test"), params())).status).toBe(403);
  }
  expect(m.student).not.toHaveBeenCalled(); expect(m.participation).not.toHaveBeenCalled();
});
test("không nhận yêu cầu lưu hoặc gửi phản hồi từ trang ngoài, kể cả cổng khác", async () => {
  for (const origin of ["https://foreign.invalid", "http://test:4000", "null"]) {
    const request = (method: string) => new Request("http://test/survey", { method, body: "{}", headers: { Origin: origin } });
    expect((await PUT(request("PUT"), params())).status).toBe(403);
    expect((await POST(request("POST"), params())).status).toBe(403);
  }
  expect(m.student).not.toHaveBeenCalled(); expect(m.draft).not.toHaveBeenCalled(); expect(m.submit).not.toHaveBeenCalled();
});
