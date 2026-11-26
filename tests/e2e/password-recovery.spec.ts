import { expect,test,type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";
import { randomUUID } from "node:crypto";
import { requestPasswordReset,resetPassword,tokenHash,resetMessage } from "../../src/modules/profile/password-reset";
test.use({actionTimeout:15000});
test("đổi và đặt lại mật khẩu thu hồi cả phiên khác, mã khôi phục chỉ dùng một lần",async({page,browser})=>{
 test.skip(!process.env.ISOLATED_FEATURE_DB,"Chỉ dùng database nghiệm thu riêng.");test.setTimeout(120000);
 const db=new PrismaClient(),tag=`PWD-${randomUUID().slice(0,6)}`,email=`${tag}@example.invalid`,old=randomUUID(),next=randomUUID(),reset=randomUUID();
 const other=await browser.newContext({baseURL:process.env.PLAYWRIGHT_BASE_URL??"http://127.0.0.1:3005"}),b=await other.newPage();let userId="";
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));b.on("pageerror",e=>errors.push(e.message));
 async function login(p:Page,password:string){await p.goto("/login");await p.getByLabel("Email",{exact:true}).fill(email);await p.getByLabel("Mật khẩu",{exact:true}).fill(password);await p.getByRole("button",{name:"Đăng nhập",exact:true}).click();await p.waitForURL("**/student",{timeout:15000});}
 try{
  const user=await db.user.create({data:{name:tag,email,passwordHash:await hash(old),roles:{create:{role:"STUDENT"}},student:{create:{studentCode:tag}}}});userId=user.id;
  await login(page,old);await login(b,old);const stolen=await other.storageState();
  let oldLink="";await requestPasswordReset(db,email,"http://127.0.0.1:3015",async(_to,url)=>{oldLink=url;});
  await page.goto("/profile");await page.getByLabel("Mật khẩu hiện tại",{exact:true}).fill("incorrect-password");await page.getByLabel("Mật khẩu mới",{exact:true}).fill(next);await page.getByLabel("Xác nhận mật khẩu mới",{exact:true}).fill(next);await page.getByRole("button",{name:"Đổi mật khẩu",exact:true}).click();await expect(page.getByRole("status")).toContainText("không đúng");expect((await b.request.get("/api/me")).status()).toBe(200);
  await page.getByLabel("Mật khẩu hiện tại",{exact:true}).fill(old);await page.getByLabel("Mật khẩu mới",{exact:true}).fill(next);await page.getByLabel("Xác nhận mật khẩu mới",{exact:true}).fill(next);await page.getByRole("button",{name:"Đổi mật khẩu",exact:true}).click();await page.waitForURL("**/login?passwordChanged=1",{timeout:15000});
  expect((await b.request.get("/api/me")).status()).toBe(401);expect((await b.request.get("/api/notifications")).status()).toBe(401);await b.goto("/profile");await expect(b).toHaveURL(/\/login$/);
  await expect(resetPassword(db,{token:new URL(oldLink).searchParams.get("token"),password:reset,confirmPassword:reset})).rejects.toThrow("Liên kết");
  await login(page,next);await login(b,next);const session=await (await page.request.get("/api/auth/session")).text();expect(session).not.toContain("credentialVersion");expect(session).not.toContain("passwordHash");
  let link="";const future=new Date(Date.now()+6*60000);const send=async(_to:string,url:string)=>{link=url;};
  expect(await requestPasswordReset(db,email,"http://127.0.0.1:3015",send,future)).toBe(resetMessage);expect(link).toContain("/reset-password?token=");
  const token=new URL(link).searchParams.get("token")!;const stored=await db.passwordReset.findUniqueOrThrow({where:{tokenHash:tokenHash(token)}});expect(stored.tokenHash).not.toBe(token);
  await expect(resetPassword(db,{token,password:reset,confirmPassword:reset},new Date(+stored.expiresAt+1))).rejects.toThrow("hết hạn");
  const response=await page.goto(link);expect(response?.headers()["referrer-policy"]).toBe("no-referrer");await page.getByLabel("Mật khẩu mới",{exact:true}).fill(reset);await page.getByLabel("Nhập lại mật khẩu mới",{exact:true}).fill("different-password");await page.getByRole("button",{name:"Đặt lại mật khẩu",exact:true}).click();await expect(page.getByRole("status")).toContainText("Không đặt lại được");
  await page.getByLabel("Mật khẩu mới",{exact:true}).fill(reset);await page.getByLabel("Nhập lại mật khẩu mới",{exact:true}).fill(reset);await page.getByRole("button",{name:"Đặt lại mật khẩu",exact:true}).click();await page.waitForURL("**/login?passwordReset=1",{timeout:15000});expect((await b.request.get("/api/me")).status()).toBe(401);
  await expect(resetPassword(db,{token,password:next,confirmPassword:next})).rejects.toThrow("Liên kết");
  const replay=await browser.newContext({storageState:stolen,baseURL:process.env.PLAYWRIGHT_BASE_URL??"http://127.0.0.1:3005"});expect((await replay.request.get("/api/me")).status()).toBe(401);await replay.close();
  await login(page,reset);expect((await page.request.get("/api/me")).status()).toBe(200);
  let unexpected=false;expect(await requestPasswordReset(db,`${tag}-missing@example.invalid`,"http://localhost:3000",async()=>{unexpected=true;})).toBe(resetMessage);expect(unexpected).toBe(false);
  expect(await db.auditLog.count({where:{actorId:userId,action:"RESET_PASSWORD"}})).toBe(1);expect(errors).toEqual([]);
 }finally{await other.close();try{if(userId){await db.auditLog.deleteMany({where:{actorId:userId}});await db.user.deleteMany({where:{id:userId}});}}finally{await db.$disconnect();}}
});
