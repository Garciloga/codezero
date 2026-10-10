/** Owner-run reset of a learner's progress. The fee is recorded, not collected, by the platform. */
export const LEARNING_RESET_FEE_CENTS = 1500;
export const LEARNING_RESET_CURRENCY = "MXN";
export const LEARNING_RESET_SCOPES = ["main", "positions", "all"] as const;
export type LearningResetScope = (typeof LEARNING_RESET_SCOPES)[number];
export function isLearningResetScope(value: unknown): value is LearningResetScope {
  return typeof value === "string" && (LEARNING_RESET_SCOPES as readonly string[]).includes(value);
}
