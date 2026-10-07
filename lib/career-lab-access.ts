export function isCareerLabOwner(profile: { role?: string; status?: string } | null) {
  return profile?.role === "owner" && profile.status === "active";
}
