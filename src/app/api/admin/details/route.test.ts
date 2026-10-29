import { beforeEach, expect, test, vi } from "vitest";
const m=vi.hoisted(()=>({auth:vi.fn(),user:{findUnique:vi.fn()},faculty:{findUnique:vi.fn()},course:{findUnique:vi.fn()}}));
vi.mock("@/auth",()=>({auth:m.auth}));
vi.mock("@/lib/db",()=>({db:{user:m.user,faculty:m.faculty,course:m.course}}));
import { GET } from "./route";
beforeEach(()=>{vi.clearAllMocks();m.auth.mockResolvedValue({user:{id:"admin"}});m.user.findUnique.mockResolvedValue({active:true,roles:[{role:"ADMIN"}]});});
test("chặn tài khoản thường và tài khoản khóa",async()=>{
  for(const actor of [{active:true,roles:[{role:"LECTURER"}]},{active:false,roles:[{role:"ADMIN"}]}]) {m.user.findUnique.mockResolvedValue(actor);expect((await GET(new Request("http://localhost/api/admin/details?type=faculty&id=f"))).status).toBe(403);}
  expect(m.faculty.findUnique).not.toHaveBeenCalled();
});
test("thông tin người dùng không truy vấn mật khẩu",async()=>{
  m.user.findUnique.mockResolvedValueOnce({active:true,roles:[{role:"ADMIN"}]}).mockResolvedValueOnce({name:"Giảng viên",email:"teacher@example.com",phone:"",bio:"Giới thiệu",active:true,lecturer:{lecturerCode:"GV1",faculty:{name:"CNTT"},courses:[]},student:null});
  const r=await GET(new Request("http://localhost/api/admin/details?type=user&id=u"));
  expect((await r.json()).name).toBe("Giảng viên");
  expect(m.user.findUnique.mock.calls[1][0].select).not.toHaveProperty("passwordHash");
});
test("khoa và môn trả thông tin thống kê đúng",async()=>{
  m.faculty.findUnique.mockResolvedValue({name:"CNTT",code:"IT",_count:{classes:2,lecturers:4,courses:10,campaigns:1}});
  expect((await (await GET(new Request("http://localhost/api/admin/details?type=faculty&id=f"))).json()).fields).toContainEqual(["Môn học","10"]);
  m.course.findUnique.mockResolvedValue({name:"Web",code:"WEB",faculty:{name:"CNTT"},lecturers:[],_count:{classes:2}});
  expect((await (await GET(new Request("http://localhost/api/admin/details?type=course&id=c"))).json()).name).toBe("Web");
});
test("đối tượng không hợp lệ hoặc đã xóa trả lỗi",async()=>{
  expect((await GET(new Request("http://localhost/api/admin/details?type=bad"))).status).toBe(400);
  m.faculty.findUnique.mockResolvedValue(null);
  expect((await GET(new Request("http://localhost/api/admin/details?type=faculty&id=gone"))).status).toBe(404);
});
