import { afterEach,expect,test,vi } from "vitest";
import { gmailConfig } from "./gmail";
afterEach(()=>vi.unstubAllEnvs());
test("Gmail dùng mật khẩu ứng dụng, chuẩn hóa khoảng trắng và chặn URL gửi sai",()=>{
 vi.stubEnv("GMAIL_USER","sender@example.com");vi.stubEnv("GMAIL_APP_PASSWORD","aaaa bbbb cccc dddd");vi.stubEnv("APP_URL","http://localhost:3000");
 expect(gmailConfig()).toMatchObject({user:"sender@example.com",pass:"aaaabbbbccccdddd",base:"http://localhost:3000"});
 for(const url of ["javascript:alert(1)","http://foreign.example","https://u:p@example.com","https://example.com?other=1"]){vi.stubEnv("APP_URL",url);expect(()=>gmailConfig()).toThrow();}
 vi.stubEnv("APP_URL","https://survey.example.com");expect(gmailConfig().base).toBe("https://survey.example.com");
});
