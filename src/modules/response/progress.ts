export function answerProgress(questions:{id:string;required:boolean}[],answers:Record<string,string|string[]>){
 const filled=(id:string)=>Array.isArray(answers[id])?answers[id].length>0:typeof answers[id]==="string"&&answers[id].trim().length>0;
 return {answered:questions.filter(q=>filled(q.id)).length,remainingRequired:questions.filter(q=>q.required&&!filled(q.id)).length};
}
