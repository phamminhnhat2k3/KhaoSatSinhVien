import { participationRate } from "./report";

export function progressGroups(participations: { status: string; student: { academicClass: { id: string; code: string; faculty: { name: string } } | null } }[]) {
  const groups = new Map<string, { id: string; title: string; invited: number; completed: number; drafts: number; rate: number }>();
  for (const p of participations) {
    const c = p.student.academicClass;
    const key = c?.id ?? "unassigned";
    const group = groups.get(key) ?? { id: key, title: c ? `${c.code} · ${c.faculty.name}` : "Chưa phân lớp", invited: 0, completed: 0, drafts: 0, rate: 0 };
    group.invited++;
    if (p.status === "COMPLETED") group.completed++;
    if (p.status === "DRAFT") group.drafts++;
    group.rate = participationRate(group.completed, group.invited);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => a.rate - b.rate || a.title.localeCompare(b.title, "vi"));
}
