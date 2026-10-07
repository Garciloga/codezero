export type OrganizationRole = "owner" | "admin" | "manager" | "supervisor" | "learner";
export type OrganizationMember = {
  organizationId: string; userId: string; role: OrganizationRole;
  reportsTo: string | null; active: boolean;
};
const ROLES = new Set(["owner", "admin", "manager", "supervisor", "learner"]);
/** Trusted, complete roster for ONE organization. Never accept client roles. */
export function validOrganizationRoster(roster: readonly OrganizationMember[]): boolean {
  if (!roster.length) return false;
  const organizationId = roster[0].organizationId;
  if (!organizationId) return false;
  const members = new Map<string, OrganizationMember>();
  for (const member of roster) {
    if (member.organizationId !== organizationId || !member.userId || members.has(member.userId)
      || !ROLES.has(member.role) || typeof member.active !== "boolean") return false;
    members.set(member.userId, member);
  }
  for (const member of roster) {
    const visited = new Set([member.userId]);
    let parent = member.reportsTo;
    while (parent !== null) {
      if (visited.has(parent) || !members.has(parent)) return false;
      visited.add(parent);
      const manager = members.get(parent)!;
      if (!["owner", "admin", "manager", "supervisor"].includes(manager.role)
        || (member.active && !manager.active)) return false;
      parent = manager.reportsTo;
    }
  }
  return true;
}
export function canViewEmployeeLearning(
  organizationId: string, viewerId: string, targetId: string, roster: readonly OrganizationMember[],
): boolean {
  if (!validOrganizationRoster(roster) || roster[0].organizationId !== organizationId) return false;
  const viewer = roster.find(member => member.userId === viewerId);
  const target = roster.find(member => member.userId === targetId);
  if (!viewer?.active || !target?.active) return false;
  if (viewerId === targetId || ["owner", "admin"].includes(viewer.role)) return true;
  if (viewer.role === "supervisor") return target.reportsTo === viewerId;
  if (viewer.role !== "manager") return false;
  let parent = target.reportsTo;
  while (parent !== null) {
    if (parent === viewerId) return true;
    parent = roster.find(member => member.userId === parent)!.reportsTo;
  }
  return false;
}
export function canManageOrganization(organizationId: string, viewerId: string, roster: readonly OrganizationMember[]): boolean {
  if (!validOrganizationRoster(roster) || roster[0].organizationId !== organizationId) return false;
  const viewer = roster.find(member => member.userId === viewerId);
  return Boolean(viewer?.active && ["owner", "admin"].includes(viewer.role));
}
/** Unique assigned requirements form the denominator, never attempt count. */
export function assignedProgress(required: readonly string[], completed: readonly string[]) {
  if (required.some(id => !id) || completed.some(id => !id)) return null;
  const assignments = new Set(required);
  if (!assignments.size) return null;
  const actual = new Set(completed);
  const done = [...assignments].filter(id => actual.has(id)).length;
  return { completed: done, total: assignments.size, percent: Math.round(done / assignments.size * 100) };
}
