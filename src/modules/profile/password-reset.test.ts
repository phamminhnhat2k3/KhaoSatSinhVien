import { expect,test,vi } from "vitest";
import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { requestPasswordReset,resetInput,resetMessage } from "./password-reset";
test("chỉ lưu băm token, SMTP lỗi không làm lộ email tồn tại hoặc giữ link còn dùng",async()=>{
 const create=vi.fn().mockImplementation(async({data})=>({id:"reset",...data}));
 const invalidate=vi.fn();const tx={user:{findUnique:vi.fn().mockResolvedValue({id:"u",active:true,passwordHash:"argon2hash"})},passwordReset:{count:vi.fn().mockResolvedValue(0),updateMany:vi.fn(),create}};
 const db={$transaction:(fn:(x:typeof tx)=>unknown)=>fn(tx),passwordReset:{updateMany:invalidate}}as unknown as PrismaClient;
 const log=vi.spyOn(console,"error").mockImplementation(()=>{});
 try{
  let raw="";const message=await requestPasswordReset(db,`${randomUUID()}@example.invalid`,"https://survey.example.com",async(_to,url)=>{raw=new URL(url).searchParams.get("token")!;throw Error("SMTP failure");});
  expect(message).toBe(resetMessage);expect(create.mock.calls[0][0].data.tokenHash).not.toBe(raw);expect(create.mock.calls[0][0].data).not.toHaveProperty("token");expect(invalidate).toHaveBeenCalledWith({where:{id:"reset",usedAt:null},data:{usedAt:expect.any(Date)}});
  expect(log.mock.calls[0][0]).not.toContain(raw);
 }finally{log.mockRestore();}
});
test("token sai định dạng và xác nhận mật khẩu khác bị từ chối",()=>{
 expect(resetInput.safeParse({token:"short",password:"password123",confirmPassword:"password123"}).success).toBe(false);
 expect(resetInput.safeParse({token:"a".repeat(64),password:"password123",confirmPassword:"different"}).success).toBe(false);
});
