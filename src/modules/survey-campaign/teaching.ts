type Teacher={id:string;facultyId:string|null;user:{active:boolean;roles:{role:string}[]}};
type Enrollment={class:{code:string;courseId:string;teachingConfigured?:boolean;lecturer:Teacher|null;teachings:{lecturer:Teacher}[]}};
export function teachingPairs(enrollments:Enrollment[],facultyId:string|null) {
  const pairs=new Map<string,{courseId:string;lecturerId:string}>();
  for(const {class:group} of enrollments){
    const teachers=group.teachingConfigured||group.teachings.length?group.teachings.map(t=>t.lecturer):group.lecturer?[group.lecturer]:[];
    if(!teachers.length)throw new Error(`Chưa phân công giảng viên cho lớp ${group.code}. Phân công trước khi công bố.`);
    for(const teacher of teachers){
      if(!teacher.user.active||!teacher.user.roles.some(r=>r.role==="LECTURER")||teacher.facultyId!==facultyId)throw new Error(`Giảng viên lớp ${group.code} không còn hoạt động hoặc không thuộc khoa. Kiểm tra lại phân công.`);
      pairs.set(`${group.courseId}:${teacher.id}`,{courseId:group.courseId,lecturerId:teacher.id});
    }
  }
  return [...pairs.values()];
}
