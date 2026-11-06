type Actor = { active: boolean; roles: { role: string }[]; lecturer?: { facultyId: string | null } | null };
export function entityReadAccess(actor: Actor | null) {
  if (!actor?.active) return null;
  if (actor.roles.some(r => r.role === "ADMIN")) return { admin: true, facultyId: undefined };
  if (actor.roles.some(r => r.role === "DEAN") && actor.lecturer?.facultyId) return { admin: false, facultyId: actor.lecturer.facultyId };
  return null;
}
