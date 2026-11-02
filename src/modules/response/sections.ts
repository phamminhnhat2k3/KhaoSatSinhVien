export type SectionQuestion = {id:string;sectionTitle?:string;courseId?:string|null;lecturerId?:string|null;required:boolean};

export function surveySections<T extends SectionQuestion>(questions:T[]) {
  const groups=new Map<string,{id:string;title:string;kind:string;questions:T[]}>();
  for(const question of questions){
    const id=question.courseId?`${question.courseId}:${question.lecturerId??"course"}`:"common";
    if(!groups.has(id))groups.set(id,{id,title:question.sectionTitle??"Nội dung chung",kind:question.lecturerId?"Đánh giá giảng viên":question.courseId?"Đánh giá môn học":"Nội dung chung",questions:[]});
    groups.get(id)!.questions.push(question);
  }
  return [...groups.values()];
}
