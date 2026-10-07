import type { CareerPositionKey } from "./career-guidance.ts";
import { practicalTie } from "./career-guidance.ts";

export type CareerDiscriminatorKey =
  | "csm_vs_am"
  | "am_vs_kam"
  | "ae_vs_kam"
  | "onboarding_vs_pm"
  | "admin_vs_exec"
  | "ts_l2_vs_presales"
  | "sdr_vs_ae"
  | "ts_l1_vs_customer_support";

export type CareerDiscriminator = {
  key: CareerDiscriminatorKey;
  positions: [CareerPositionKey, CareerPositionKey];
  title: string;
  goal: string;
};

export const CAREER_DISCRIMINATORS: CareerDiscriminator[] = [
  {
    key: "csm_vs_am",
    positions: ["customer_success", "account_manager"],
    title: "Valor del cliente vs crecimiento comercial",
    goal: "Distinguir gestión proactiva de valor/adopción frente a renovación, negociación y expansión.",
  },
  {
    key: "am_vs_kam",
    positions: ["account_manager", "key_account_manager"],
    title: "Cartera comercial vs cuenta estratégica",
    goal: "Distinguir gestión eficiente de cartera frente a gobierno multistakeholder y estrategia de cuenta.",
  },
  {
    key: "ae_vs_kam",
    positions: ["account_executive", "key_account_manager"],
    title: "Cerrar negocio nuevo vs desarrollar cuenta estratégica",
    goal: "Distinguir adquisición/cierre frente a crecimiento estratégico de una cuenta existente.",
  },
  {
    key: "onboarding_vs_pm",
    positions: ["onboarding", "project_manager"],
    title: "Time-to-value vs gobierno del proyecto",
    goal: "Distinguir implementación/adopción del cliente frente a alcance, dependencias, riesgos y recursos.",
  },
  {
    key: "admin_vs_exec",
    positions: ["administrative_assistant", "executive_assistant"],
    title: "Ejecución operativa vs anticipación ejecutiva",
    goal: "Distinguir orden/precisión operativa frente a soporte ejecutivo, discreción y anticipación.",
  },
  {
    key: "ts_l2_vs_presales",
    positions: ["tech_support_l2", "pre_sales"],
    title: "Diagnóstico profundo vs traducción técnica a valor",
    goal: "Distinguir troubleshooting técnico frente a demo, viabilidad y conversación técnico-comercial.",
  },
  {
    key: "sdr_vs_ae",
    positions: ["sdr_bdr", "account_executive"],
    title: "Prospección vs cierre",
    goal: "Distinguir apertura/calificación de oportunidades frente a negociación y cierre.",
  },
  {
    key: "ts_l1_vs_customer_support",
    positions: ["tech_support_l1", "customer_support"],
    title: "Triage técnico vs resolución funcional",
    goal: "Distinguir evidencia/reproducción/escalación técnica frente a resolución de uso y comunicación.",
  },
];

function pairKey(a: CareerPositionKey, b: CareerPositionKey) {
  return [a, b].sort().join("::");
}

const discriminatorByPair = new Map(
  CAREER_DISCRIMINATORS.map((d) => [pairKey(...d.positions), d] as const),
);

export type RankedPosition = {
  position: CareerPositionKey;
  affinity: number;
};

export type AdaptiveDiagnosticState = {
  completedBaseActivities: number;
  completedDiscriminators: CareerDiscriminatorKey[];
  maxDiscriminators?: number;
};

export type AdaptiveNextStep =
  | {
      kind: "base";
      reason: "base_incomplete";
      remainingBaseActivities: number;
    }
  | {
      kind: "discriminator";
      discriminator: CareerDiscriminator;
      tiedPositions: [CareerPositionKey, CareerPositionKey];
      gap: number;
    }
  | {
      kind: "result";
      reason:
        | "clear_enough"
        | "no_discriminator_available"
        | "max_discriminators_reached"
        | "insufficient_rankings";
    };

export function findTiedPairs(
  rankings: RankedPosition[],
  topN = 5,
  threshold = .05,
) {
  const top = rankings.slice(0, topN);
  const pairs: {
    positions: [CareerPositionKey, CareerPositionKey];
    gap: number;
  }[] = [];

  for (let i = 0; i < top.length; i += 1) {
    for (let j = i + 1; j < top.length; j += 1) {
      const a = top[i];
      const b = top[j];
      const gap = Math.abs(a.affinity - b.affinity);
      if (practicalTie(a.affinity, b.affinity, threshold)) {
        pairs.push({
          positions: [a.position, b.position],
          gap,
        });
      }
    }
  }

  return pairs.sort((a, b) => a.gap - b.gap);
}

export function chooseNextAdaptiveStep(
  rankings: RankedPosition[],
  state: AdaptiveDiagnosticState,
): AdaptiveNextStep {
  const baseTarget = 8;
  if (state.completedBaseActivities < baseTarget) {
    return {
      kind: "base",
      reason: "base_incomplete",
      remainingBaseActivities: baseTarget - state.completedBaseActivities,
    };
  }

  if (rankings.length < 2) {
    return { kind: "result", reason: "insufficient_rankings" };
  }

  const maxDiscriminators = state.maxDiscriminators ?? 3;
  if (state.completedDiscriminators.length >= maxDiscriminators) {
    return { kind: "result", reason: "max_discriminators_reached" };
  }

  const completed = new Set(state.completedDiscriminators);
  const tiedPairs = findTiedPairs(rankings);

  for (const tied of tiedPairs) {
    const discriminator = discriminatorByPair.get(pairKey(...tied.positions));
    if (discriminator && !completed.has(discriminator.key)) {
      return {
        kind: "discriminator",
        discriminator,
        tiedPositions: tied.positions,
        gap: tied.gap,
      };
    }
  }

  if (tiedPairs.length > 0) {
    return { kind: "result", reason: "no_discriminator_available" };
  }

  return { kind: "result", reason: "clear_enough" };
}

export function diagnosticProgress(state: AdaptiveDiagnosticState) {
  const baseTarget = 8;
  const maxDiscriminators = state.maxDiscriminators ?? 3;
  const completedBase = Math.min(baseTarget, Math.max(0, state.completedBaseActivities));
  const completedExtra = Math.min(
    maxDiscriminators,
    Math.max(0, state.completedDiscriminators.length),
  );

  return {
    completedBase,
    baseTarget,
    completedExtra,
    maxDiscriminators,
    minTotal: baseTarget,
    maxTotal: baseTarget + maxDiscriminators,
  };
}
