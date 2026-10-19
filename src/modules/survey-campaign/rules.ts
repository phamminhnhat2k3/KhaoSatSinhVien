export type CampaignState = "DRAFT" | "PUBLISHED" | "CLOSED" | "CANCELLED";

const transitions: Record<CampaignState, CampaignState[]> = {
  DRAFT: ["PUBLISHED", "CANCELLED"], PUBLISHED: ["CLOSED", "CANCELLED"], CLOSED: [], CANCELLED: []
};

export function canTransition(from: CampaignState, to: CampaignState) { return transitions[from].includes(to); }
export function isAcceptingResponses(status: CampaignState, startsAt: Date, endsAt: Date, now = new Date()) {
  return status === "PUBLISHED" && startsAt <= now && now <= endsAt;
}
