import { campaignPhase, type CampaignState } from "./rules";

type Participation = { status: string; campaign: { status: CampaignState; startsAt: Date; endsAt: Date } };
export function studentWorklist<T extends Participation>(items: T[], now = new Date()) {
  const phase = (item: T) => campaignPhase(item.campaign, now);
  const open = items.filter(p => p.status !== "COMPLETED" && phase(p) === "OPEN")
    .sort((a, b) => Number(b.status === "DRAFT") - Number(a.status === "DRAFT") || a.campaign.endsAt.getTime() - b.campaign.endsAt.getTime());
  return {
    open, drafts: open.filter(p => p.status === "DRAFT"),
    scheduled: items.filter(p => p.status !== "COMPLETED" && phase(p) === "SCHEDULED"),
    completed: items.filter(p => p.status === "COMPLETED"),
    ended: items.filter(p => p.status !== "COMPLETED" && ["EXPIRED", "CLOSED", "CANCELLED"].includes(phase(p)))
  };
}
export function studentFilterHref(params: { semesterId?: string; q?: string }, view: string) {
  const query = new URLSearchParams();
  if (params.semesterId) query.set("semesterId", params.semesterId);
  if (params.q) query.set("q", params.q);
  if (view !== "all") query.set("view", view);
  return `/student${query.size ? `?${query}` : ""}`;
}
