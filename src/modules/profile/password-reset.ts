import { randomBytes, createHash } from "node:crypto";
import { hash } from "argon2";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { credentialVersion } from "./session";
export const resetMessage="Nếu email thuộc tài khoản đang hoạt động, liên kết đặt lại mật khẩu sẽ được gửi. Bạn có thể kiểm tra hộp thư và thư rác, chờ ít nhất 5 phút trước khi yêu cầu lại.";
export const resetInput=z.object({token:z.string().regex(/^[a-f0-9]{64}$/),password:z.string().min(8).max(100),confirmPassword:z.string()}).refine(v=>v.password===v.confirmPassword,"Xác nhận mật khẩu không khớp.");
export function tokenHash(token:string){return createHash("sha256").update(token).digest("hex");}
const attempts=new Map<string,number>();
export async function requestPasswordReset(db:PrismaClient,email:string,base:string,send:(to:string,url:string)=>Promise<void>,now=new Date()) {
  const normalized=z.email().max(191).parse(email.trim().toLowerCase()),key=tokenHash(normalized);
  for(const [k,expiry]of attempts)if(expiry<=+now)attempts.delete(k);
  if(attempts.has(key)||attempts.size>=1000)return resetMessage;
  attempts.set(key,+now+5*60000);
  const token=randomBytes(32).toString("hex");
  const record=await db.$transaction(async tx=>{
    const user=await tx.user.findUnique({where:{email:normalized},select:{id:true,passwordHash:true,active:true}});
    if(!user?.active)return null;
    if(await tx.passwordReset.count({where:{userId:user.id,createdAt:{gt:new Date(+now-5*60000)}}}))return null;
    await tx.passwordReset.updateMany({where:{userId:user.id,usedAt:null},data:{usedAt:now}});
    return tx.passwordReset.create({data:{userId:user.id,tokenHash:tokenHash(token),passwordVersion:credentialVersion(user.passwordHash),expiresAt:new Date(+now+15*60000),createdAt:now}});
  },{isolationLevel:"Serializable"});
  if(record)try{await send(normalized,`${base}/reset-password?token=${token}`);}catch{await db.passwordReset.updateMany({where:{id:record.id,usedAt:null},data:{usedAt:now}});console.error("Không gửi được email đặt lại mật khẩu. Kiểm tra cấu hình Gmail trên máy chủ.");}
  return resetMessage;
}
export async function resetPassword(db:PrismaClient,input:unknown,now=new Date()) {
  const data=resetInput.parse(input);
  const record=await db.passwordReset.findUnique({where:{tokenHash:tokenHash(data.token)},include:{user:true}});
  if(!record||record.usedAt||record.expiresAt<=now||!record.user.active||record.passwordVersion!==credentialVersion(record.user.passwordHash))throw new Error("Liên kết không hợp lệ, đã dùng hoặc hết hạn. Hãy yêu cầu lại.");
  const passwordHash=await hash(data.password);
  await db.$transaction(async tx=>{
    const used=await tx.passwordReset.updateMany({where:{id:record.id,usedAt:null,expiresAt:{gt:now}},data:{usedAt:now}});
    if(used.count!==1)throw new Error("Liên kết đã dùng hoặc hết hạn.");
    const changed=await tx.user.updateMany({where:{id:record.userId,active:true,passwordHash:record.user.passwordHash},data:{passwordHash}});
    if(changed.count!==1)throw new Error("Mật khẩu đã thay đổi. Hãy yêu cầu liên kết mới.");
    await tx.passwordReset.updateMany({where:{userId:record.userId,usedAt:null},data:{usedAt:now}});
    await tx.auditLog.create({data:{actorId:record.userId,action:"RESET_PASSWORD",entity:"User",entityId:record.userId}});
    await tx.notification.create({data:{userId:record.userId,title:"Mật khẩu đã được đặt lại",body:"Mật khẩu vừa được đổi qua liên kết email. Mọi phiên đăng nhập cũ đã mất hiệu lực.",href:"/profile"}});
  },{isolationLevel:"Serializable"});
}
