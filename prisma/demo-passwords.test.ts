import {expect,test} from "vitest";
import {readDemoPasswords} from "./demo-passwords";
const accounts=[{email:"demo.sv.a@example.com"},{email:"demo.gv.a@example.com"}];
const row=(email:string,password:string)=>`| CODE | Tên | Vai trò | ${email} | ${password} | Khoa |`;
test("đọc đủ mật khẩu mẫu từ 8 ký tự và không đọc nhầm dòng ngoài bộ mẫu",()=>{
 const text=["# Tài khoản",...accounts.map(a=>row(a.email,"Demo12345")),row("admin@demo.vn","Other123")].join("\n");
 const passwords=readDemoPasswords(text,accounts);expect(passwords.size).toBe(2);expect(passwords.get(accounts[0].email)).toBe("Demo12345");
});
test("thiếu tài khoản hoặc mật khẩu quá ngắn phải dừng, không tự đặt lại",()=>{
 expect(()=>readDemoPasswords(row(accounts[0].email,"Demo12345"),accounts)).toThrow("giữ nguyên dữ liệu");
 expect(()=>readDemoPasswords(accounts.map(a=>row(a.email,"short")).join("\n"),accounts)).toThrow("tối thiểu 8");
});
