import { expect,test,vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { credentialVersion,validateCredentialToken } from "./session";
test("phiên chỉ còn hiệu lực khi phiên bản mật khẩu khớp tài khoản đang hoạt động",async()=>{
 const findUnique=vi.fn().mockResolvedValue({active:true,passwordHash:"argon2-old"});const db={user:{findUnique}}as unknown as PrismaClient;
 const token={id:"user",roles:[],credentialVersion:credentialVersion("argon2-old")};
 expect(await validateCredentialToken(db,token)).toBe(token);
 findUnique.mockResolvedValue({active:true,passwordHash:"argon2-new"});expect(await validateCredentialToken(db,token)).toBeNull();
 findUnique.mockResolvedValue({active:false,passwordHash:"argon2-old"});expect(await validateCredentialToken(db,token)).toBeNull();
 findUnique.mockResolvedValue(null);expect(await validateCredentialToken(db,token)).toBeNull();
 expect(await validateCredentialToken(db,{id:"user",roles:[]})).toBeNull();
});
