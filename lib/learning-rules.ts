export function isLevelUnlocked(levelNumber: number, passedLevels: Set<number>) {
  if (levelNumber <= 1) return true;

  for (let n = 1; n < levelNumber; n += 1) {
    if (!passedLevels.has(n)) return false;
  }

  return true;
}

export function isLevelIncludedInPlan(
  levelNumber: number,
  planName: string,
  role?: string | null
) {
  if (role === "owner" || role === "admin") return true;
  if (planName === "starter" || planName === "pro" || planName === "enterprise") return true;
  return levelNumber === 1;
}
