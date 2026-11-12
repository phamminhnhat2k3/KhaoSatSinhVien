import { currentUser } from "@/lib/access";
import { db } from "@/lib/db";
import { noteDocument, reportResponse } from "@/modules/reporting/files";
export async function GET(request: Request,{params}:{params:Promise<{id:string}>}) {
  const user=await currentUser();
  if(!user?.roles.includes("ADMIN"))return new Response("Không có quyền xuất báo cáo nhà trường.",{status:403});
  const note=await db.resultNote.findFirst({where:{id:(await params).id,status:"SENT"},include:{author:{select:{name:true}}}});
  if(!note)return new Response("Chỉ xuất bản nhận xét đã gửi.",{status:404});
  const format=new URL(request.url).searchParams.get("format");
  if(format!=="pdf"&&format!=="xlsx")return new Response("Chọn PDF hoặc XLSX.",{status:400});
  return reportResponse(noteDocument(note),format);
}
