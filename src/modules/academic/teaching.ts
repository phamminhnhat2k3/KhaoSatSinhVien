import type {Prisma} from "@prisma/client";
export async function assignClassTeachers(tx:Prisma.TransactionClient,actorId:string,classId:string,teacherIds:string[]) {
  const ids=[...new Set(teacherIds)];if(ids.length>1)throw new Error("Một lớp học phần chỉ được phân công một giảng viên.");
  const group=await tx.courseClass.update({where:{id:classId},data:{teachingConfigured:true},include:{course:true}});
  if(!group.course.facultyId)throw new Error("Phân khoa cho môn học trước khi phân công.");
  const count=await tx.lecturerProfile.count({where:{id:{in:ids},facultyId:group.course.facultyId,user:{active:true,roles:{some:{role:"LECTURER"}}}}});
  if(count!==ids.length)throw new Error("Chỉ chọn giảng viên đang hoạt động trong khoa của môn học.");
  await tx.courseTeaching.deleteMany({where:{classId}});
  if(ids.length){
    await tx.courseTeaching.createMany({data:ids.map(lecturerId=>({classId,lecturerId}))});
    await tx.course.update({where:{id:group.courseId},data:{lecturers:{connect:ids.map(id=>({id}))}}});
  }
  await tx.auditLog.create({data:{actorId,action:"ASSIGN_TEACHERS",entity:"CourseClass",entityId:classId}});
}
