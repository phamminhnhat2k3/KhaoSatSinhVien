import type {Prisma,PrismaClient} from "@prisma/client";
import {templateSchema} from "./rules";

async function lockedTemplate(tx:Prisma.TransactionClient,id:string,version:number){
  // Lock the parent before checking references, including concurrent campaign creation.
  await tx.$queryRaw`SELECT id FROM SurveyTemplate WHERE id = ${id} FOR UPDATE`;
  const source=await tx.surveyTemplate.findUniqueOrThrow({where:{id},include:{_count:{select:{campaigns:true,courseCampaigns:true}}}});
  if(source.version!==version)throw new Error("Mẫu đã được cập nhật. Tải lại thư viện trước khi tiếp tục; bản nháp của bạn vẫn được giữ.");
  return source;
}
export async function editTemplate(db:Pick<PrismaClient,"$transaction">,actorId:string,id:string,version:number,input:unknown){
  const data=templateSchema.parse(input);
  return db.$transaction(async tx=>{
    const source=await lockedTemplate(tx,id,version);
    const versioned=source._count.campaigns+source._count.courseCampaigns>0;
    const questions=data.questions.map((q,position)=>({...q,position:position+1,options:{create:q.options.map((o,i)=>({...o,position:i+1}))}}));
    const template=versioned
      ?await tx.surveyTemplate.create({data:{title:data.title,version:source.version+1,questions:{create:questions}}})
      :await tx.surveyTemplate.update({where:{id,version},data:{title:data.title,version:{increment:1},questions:{deleteMany:{},create:questions}}});
    await tx.auditLog.create({data:{actorId,action:versioned?"CREATE_VERSION":"UPDATE",entity:"SurveyTemplate",entityId:template.id}});
    return {template,versioned};
  });
}
export async function removeTemplate(db:Pick<PrismaClient,"$transaction">,actorId:string,id:string,version:number){
  return db.$transaction(async tx=>{
    const source=await lockedTemplate(tx,id,version);
    if(source._count.campaigns+source._count.courseCampaigns>0)throw new Error("Không thể xóa mẫu đã gắn vào đợt khảo sát. Cần giữ mẫu để bảo toàn phiếu và kết quả.");
    await tx.surveyTemplate.delete({where:{id,version}});
    await tx.auditLog.create({data:{actorId,action:"DELETE",entity:"SurveyTemplate",entityId:id}});
  });
}
