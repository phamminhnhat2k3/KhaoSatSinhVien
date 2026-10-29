import { beforeEach, expect, test, vi } from "vitest";
const m=vi.hoisted(()=>({auth:vi.fn(),findUnique:vi.fn(),readFile:vi.fn(),mkdir:vi.fn(),writeFile:vi.fn(),rename:vi.fn(),unlink:vi.fn()}));
vi.mock("@/auth",()=>({auth:m.auth}));
vi.mock("@/lib/db",()=>({db:{user:{findUnique:m.findUnique}}}));
vi.mock("node:fs/promises",()=>({readFile:m.readFile,mkdir:m.mkdir,writeFile:m.writeFile,rename:m.rename,unlink:m.unlink}));
import { GET, POST } from "./route";
const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==","base64");
beforeEach(()=>{vi.clearAllMocks();m.auth.mockResolvedValue({user:{id:"owner"}});m.findUnique.mockResolvedValue({id:"owner",active:true,roles:[{role:"STUDENT"}]});m.readFile.mockResolvedValue(png);m.mkdir.mockResolvedValue(undefined);m.writeFile.mockResolvedValue(undefined);m.rename.mockResolvedValue(undefined);m.unlink.mockResolvedValue(undefined);});
test("chỉ chủ tài khoản hoặc admin xem được ảnh và không nhận đường dẫn tùy ý",async()=>{
  expect((await GET(new Request("http://localhost/api/avatars?id=other"))).status).toBe(403);
  expect(m.readFile).not.toHaveBeenCalled();
  expect((await GET(new Request("http://localhost/api/avatars?id=..%2Fsecret"))).status).toBe(400);
  const response=await GET(new Request("http://localhost/api/avatars"));expect(response.status).toBe(200);expect(response.headers.get("Content-Type")).toBe("image/png");
});
test("tải ảnh luôn lưu cho chủ phiên đăng nhập dù form gửi id khác",async()=>{
  const data=new FormData();data.set("avatar",new Blob([png],{type:"image/png"}),"image.png");data.set("id","other");
  const response=await POST(new Request("http://localhost/api/avatars",{method:"POST",body:data}));
  expect(response.status).toBe(200);expect(m.rename.mock.calls[0][1]).toMatch(/owner\.img$/);
});
test("từ chối ảnh giả, origin ngoài hệ thống và tài khoản khóa",async()=>{
  const data=new FormData();data.set("avatar",new Blob(["<svg onload='alert(1)'/>"],{type:"image/png"}),"fake.png");
  expect((await POST(new Request("http://localhost/api/avatars",{method:"POST",body:data}))).status).toBe(400);
  expect((await POST(new Request("http://localhost/api/avatars",{method:"POST",headers:{origin:"https://foreign.example"},body:data}))).status).toBe(403);
  m.findUnique.mockResolvedValue({id:"owner",active:false,roles:[]});
  expect((await POST(new Request("http://localhost/api/avatars",{method:"POST",body:data}))).status).toBe(401);
  expect(m.writeFile).not.toHaveBeenCalled();
});
