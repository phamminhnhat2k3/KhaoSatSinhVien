import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { avatarMime, MAX_AVATAR_BYTES } from "@/modules/profile/avatar";
export const runtime = "nodejs";
async function actor() {
  const session=await auth();
  return session?.user?.id ? db.user.findUnique({where:{id:session.user.id},select:{id:true,active:true,roles:true}}) : null;
}
const directory=path.join(process.cwd(),".data","avatars");
export async function GET(request:Request) {
  const user=await actor();
  if(!user?.active) return new Response(null,{status:401});
  const id=new URL(request.url).searchParams.get("id") || user.id;
  if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) return new Response(null,{status:400});
  if(id!==user.id && !user.roles.some(r=>r.role==="ADMIN")) return new Response(null,{status:403});
  try { const bytes=await readFile(path.join(directory,`${id}.img`));const mime=avatarMime(bytes);if(!mime) return new Response(null,{status:404});return new Response(new Uint8Array(bytes),{headers:{"Content-Type":mime,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}}); }
  catch { return new Response(null,{status:404}); }
}
export async function POST(request:Request) {
  const user=await actor();
  if(!user?.active) return Response.json({message:"Vui lòng đăng nhập."},{status:401});
  const origin=request.headers.get("origin");
  if(origin) { try { const url=new URL(origin);if(!["http:","https:"].includes(url.protocol)||url.host!==(request.headers.get("host")??new URL(request.url).host)) return Response.json({message:"Yêu cầu không hợp lệ."},{status:403}); } catch { return new Response(null,{status:403}); } }
  if(Number(request.headers.get("content-length")??0)>MAX_AVATAR_BYTES+65536) return Response.json({message:"Ảnh tối đa 2 MB."},{status:413});
  const form=await request.formData().catch(()=>null), file=form?.get("avatar");
  if(!(file instanceof File)||file.size>MAX_AVATAR_BYTES||!file.size) return Response.json({message:"Chọn ảnh PNG, JPG hoặc WebP tối đa 2 MB."},{status:400});
  const bytes=Buffer.from(await file.arrayBuffer());
  if(avatarMime(bytes)!==file.type) return Response.json({message:"Định dạng hoặc nội dung ảnh không hợp lệ."},{status:400});
  if(!/^[a-zA-Z0-9_-]{1,100}$/.test(user.id)) return new Response(null,{status:400});
  const temp=path.join(directory,`${user.id}-${randomUUID()}.tmp`);
  try { await mkdir(directory,{recursive:true});await writeFile(temp,bytes,{flag:"wx"});await rename(temp,path.join(directory,`${user.id}.img`));return Response.json({message:"Đã cập nhật ảnh đại diện."}); }
  catch { await unlink(temp).catch(()=>{});return Response.json({message:"Chưa lưu được ảnh. Vui lòng thử lại."},{status:500}); }
}
