import {z} from "zod";
import type {TemplateInput} from "./rules";

// shortcut: one local draft per account/source; add a draft list if parallel new templates are needed.
export function templateDraftKey(userId:string,source?:string) {
  return `survey-template-draft:v1:${encodeURIComponent(userId)}:${source?`copy:${encodeURIComponent(source)}`:"new"}`;
}
const draftSchema=z.object({
  version:z.literal(1),savedAt:z.number().int().nonnegative(),title:z.string().max(120),
  questions:z.array(z.object({
    type:z.enum(["SCALE","SINGLE","MULTIPLE","TEXT"]),content:z.string().max(1000),required:z.boolean(),
    scaleMin:z.number(),scaleMax:z.number(),scaleStep:z.number(),
    options:z.array(z.object({label:z.string().max(200),value:z.string().min(1).max(100)})).max(30)
  })).max(100)
});
export function readTemplateDraft(raw:string|null) {
  if(!raw||raw.length>1_500_000)return null;
  try{const result=draftSchema.safeParse(JSON.parse(raw));return result.success?result.data:null;}catch{return null;}
}
export function writeTemplateDraft(data:TemplateInput,now=Date.now()) {
  return JSON.stringify({version:1,savedAt:now,title:data.title,questions:data.questions.map(q=>({type:q.type,content:q.content,required:q.required,scaleMin:q.scaleMin,scaleMax:q.scaleMax,scaleStep:q.scaleStep,options:q.options}))});
}
