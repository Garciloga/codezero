import type { CareerPositionKey } from "./career-guidance.ts";
import { LEARNING_GUIDES } from "./career-learning-content.ts";

export const LEARNING_GOALS = ["foundation", "guided", "challenge"] as const;
export type LearningGoal = typeof LEARNING_GOALS[number];
export const GOAL_LABELS: Record<LearningGoal, string> = {
  foundation: "Comprender fundamentos",
  guided: "Aplicar con una guía",
  challenge: "Resolver un reto autónomo",
};
export type LearningPath = {
  position: CareerPositionKey;
  goal: LearningGoal;
  reviewed: LearningGoal[];
  history: { goal: LearningGoal; reason: "choice" | "reinforce" | "reviewed" }[];
  feedback: { correct: boolean; explanation: string } | null;
};
export type LearningAction =
  | { type: "choose"; goal: LearningGoal }
  | { type: "answer"; option: number }
  | { type: "review"; checks: boolean[] };

export function startLearningPath(position: CareerPositionKey): LearningPath {
  return { position, goal: "foundation", reviewed: [], history: [], feedback: null };
}

export function transitionLearningPath(state: LearningPath, action: LearningAction): LearningPath {
  if (action.type === "choose") {
    if (!LEARNING_GOALS.includes(action.goal)) return state;
    return {
      ...state, goal: action.goal, feedback: null,
      history: [...state.history, { goal: action.goal, reason: "choice" as const }].slice(-50),
    };
  }
  if (action.type === "answer") {
    if (state.goal !== "foundation" || !Number.isInteger(action.option)) return state;
    const selected = LEARNING_GUIDES[state.position].options[action.option];
    if (!selected) return state;
    // Correct knowledge checks mark this introductory mission reviewed, never professional competence.
    return {
      ...state,
      feedback: { correct: selected.correct, explanation: selected.explanation },
      reviewed: selected.correct ? [...new Set([...state.reviewed, "foundation" as const])] : state.reviewed,
      history: [...state.history, { goal: "foundation" as const, reason: selected.correct ? "reviewed" as const : "reinforce" as const }].slice(-50),
    };
  }
  if (state.goal === "foundation" || action.checks.length !== 3 || !action.checks.every(v => v === true)) return state;
  return {
    ...state,
    reviewed: [...new Set([...state.reviewed, state.goal])],
    history: [...state.history, { goal: state.goal, reason: "reviewed" as const }].slice(-50),
  };
}
