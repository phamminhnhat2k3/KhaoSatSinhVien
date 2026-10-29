import { beforeEach, expect, test, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(), user: { findUnique: vi.fn() },
  notification: { count: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn() }
}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ db: { user: mocks.user, notification: mocks.notification } }));
import { GET, PATCH } from "./route";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "owner" } });
  mocks.user.findUnique.mockResolvedValue({ id: "owner", active: true });
  mocks.notification.count.mockResolvedValue(1);
  mocks.notification.findMany.mockResolvedValue([{ id: "mine", title: "Tin riêng" }]);
  mocks.notification.findFirst.mockResolvedValue({ id: "mine", title: "Tin riêng" });
  mocks.notification.updateMany.mockResolvedValue({ count: 1 });
});
function request(origin = "http://127.0.0.1:3015", body = '{"id":"notice"}') {
  return new Request("http://localhost:3015/api/notifications", { method: "PATCH", headers: { host: "127.0.0.1:3015", origin, "Content-Type": "application/json" }, body });
}
test("danh sách luôn giới hạn tài khoản hiện tại và phân trang hợp lệ", async () => {
  const response = await GET(new Request("http://localhost/api/notifications?page=2&filter=unread&userId=other"));
  expect(response.status).toBe(200);
  expect(mocks.notification.findMany.mock.calls[0][0]).toMatchObject({ where: { userId: "owner", readAt: null }, take: 20, skip: 20 });
  expect(mocks.notification.findFirst.mock.calls[0][0].where).toEqual({ userId: "owner" });
});
test("chấp nhận Origin khớp host thực dù URL nội bộ của Next dùng localhost", async () => {
  const response = await PATCH(request());
  expect(response.status).toBe(200);
  expect(mocks.notification.updateMany).toHaveBeenCalledWith({ where: { userId: "owner", id: "notice", readAt: null }, data: { readAt: expect.any(Date) } });
});
test("chặn Origin ngoài hệ thống hoặc không hợp lệ", async () => {
  for (const origin of ["https://foreign.example", "null", "http://127.0.0.1:3016"]) expect((await PATCH(request(origin))).status).toBe(403);
  expect(mocks.notification.updateMany).not.toHaveBeenCalled();
});
test("đánh dấu tất cả chỉ cập nhật người đang đăng nhập và từ chối dữ liệu lỗi", async () => {
  expect((await PATCH(request("http://127.0.0.1:3015", '{"all":true}'))).status).toBe(200);
  expect(mocks.notification.updateMany.mock.calls[0][0].where).toEqual({ userId: "owner", readAt: null });
  mocks.notification.updateMany.mockClear();
  for (const body of ['{}','{"id":""}', 'not-json']) expect((await PATCH(request("http://127.0.0.1:3015", body))).status).toBe(400);
  expect(mocks.notification.updateMany).not.toHaveBeenCalled();
});
test("tài khoản đã khóa không được lấy hoặc sửa thông báo bằng phiên cũ", async () => {
  mocks.user.findUnique.mockResolvedValue({ id: "owner", active: false });
  expect((await GET(new Request("http://localhost/api/notifications"))).status).toBe(401);
  expect((await PATCH(request())).status).toBe(401);
  expect(mocks.notification.findMany).not.toHaveBeenCalled();
  expect(mocks.notification.updateMany).not.toHaveBeenCalled();
});
