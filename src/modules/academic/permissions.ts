export function canManageFaculty(roles: readonly string[]) {
  return roles.includes("ADMIN");
}
