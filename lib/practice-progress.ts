import { API_LABS, PRACTICE_ACTIVITIES, TARGET_ROLES } from "./practice-learning.ts";
export const PRACTICE_VERSION = "samples-v1";
export type PracticeProgress = { version: string; role: string; passed: string[]; startDay: string; onboarding: number[]; pulse: string };
export const EMPTY_PRACTICE_PROGRESS: PracticeProgress = { version: PRACTICE_VERSION, role: "technical_cs", passed: [], startDay: "", onboarding: [], pulse: "" };
/** Private self-checks, never official competency, quota or diploma evidence. */
export function validPracticeProgress(value: unknown): value is PracticeProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value as Record<string, unknown>;
  if (Object.keys(p).sort().join(",") !== "onboarding,passed,pulse,role,startDay,version" || p.version !== PRACTICE_VERSION) return false;
  if (!TARGET_ROLES.some(role => role.id === p.role)) return false;
  const ids = [...PRACTICE_ACTIVITIES, ...API_LABS].map(item => item.id);
  if (!Array.isArray(p.passed) || p.passed.length > ids.length || new Set(p.passed).size !== p.passed.length || !p.passed.every(id => typeof id === "string" && ids.includes(id))) return false;
  if (!Array.isArray(p.onboarding) || p.onboarding.length > 7 || new Set(p.onboarding).size !== p.onboarding.length || !p.onboarding.every(n => Number.isInteger(n) && n >= 0 && n < 7)) return false;
  if (typeof p.pulse !== "string" || p.pulse.length > 500 || typeof p.startDay !== "string") return false;
  if (p.startDay === "") return true;
  if (!/^20[0-9]{2}-[0-9]{2}-[0-9]{2}$/.test(p.startDay)) return false;
  const date = new Date(`${p.startDay}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === p.startDay;
}
