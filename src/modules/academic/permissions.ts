export function canManageFaculty(roles: readonly string[], ownFaculty: string | null | undefined, target: string | null | undefined) {
  return roles.includes("ADMIN") || (roles.includes("DEAN") && !!ownFaculty && ownFaculty === target);
}
