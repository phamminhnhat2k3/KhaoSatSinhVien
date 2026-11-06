import {campaignPhase,type CampaignState} from "@/modules/survey-campaign/rules";
type Filters={q?:string;semesterId?:string;phase?:string};
export function initialReportSection(sections:{id:string;responses:number}[],minimum:number,compact:boolean){
 return compact ? sections.find(s=>s.responses>=minimum)?.id ?? sections[0]?.id ?? "all" : "all";
}
export function matchesReportFilters(campaign:{title:string;semesterId:string|null;status:CampaignState;startsAt:Date;endsAt:Date},params:Filters,now=new Date()){
 return campaign.title.toLocaleLowerCase("vi").includes((params.q??"").trim().slice(0,100).toLocaleLowerCase("vi"))&&(!params.semesterId||campaign.semesterId===params.semesterId)&&(!params.phase||campaignPhase(campaign,now)===params.phase);
}
export function campaignReportHref(id:string,params:Filters){
 const query=new URLSearchParams({campaign:id});
 for(const key of ["q","semesterId","phase"] as const)if(params[key])query.set(key,params[key]);
 return `?${query}#ket-qua`;
}
