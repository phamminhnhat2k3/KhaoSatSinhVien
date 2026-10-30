export type CampaignState = "DRAFT" | "PUBLISHED" | "CLOSED" | "CANCELLED";

const transitions: Record<CampaignState, CampaignState[]> = {
  DRAFT: ["PUBLISHED", "CANCELLED"], PUBLISHED: ["CLOSED", "CANCELLED"], CLOSED: [], CANCELLED: []
};

export function canTransition(from: CampaignState, to: CampaignState) { return transitions[from].includes(to); }
export function isAcceptingResponses(status: CampaignState, startsAt: Date, endsAt: Date, now = new Date()) {
  return status === "PUBLISHED" && startsAt <= now && now <= endsAt;
}
export function campaignPhase(campaign:{status:CampaignState;startsAt:Date;endsAt:Date},now=new Date()) {
  if(campaign.status!=="PUBLISHED")return campaign.status;
  if(now<campaign.startsAt)return "SCHEDULED";
  return now>campaign.endsAt?"EXPIRED":"OPEN";
}
export const campaignPhaseLabels={DRAFT:"Bản nháp",SCHEDULED:"Chờ bắt đầu",OPEN:"Đang tiếp nhận",EXPIRED:"Hết hạn",CLOSED:"Đã đóng",CANCELLED:"Đã hủy"};
