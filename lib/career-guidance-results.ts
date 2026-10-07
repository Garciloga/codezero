import type {
  CareerDimension,
  CareerEvidence,
  CareerPositionKey,
  ExperienceEvidence,
  ExperienceGateStatus,
} from "./career-guidance.ts";
import {
  calculateProfileConfidence,
  experienceGate,
  POSITION_WEIGHTS,
  rankPositions,
} from "./career-guidance.ts";

export const CAREER_MODEL_VERSION = "career-guidance-v0.7";

export type CareerFamilyKey =
  | "engineering"
  | "technical_support"
  | "customer_service"
  | "implementation"
  | "customer_success"
  | "account_management"
  | "commercial"
  | "projects"
  | "assistance"
  | "leadership";

export const CAREER_POSITION_META: Record<
  CareerPositionKey,
  { label: string; family: CareerFamilyKey; seniorityGate: boolean }
> = {
  developer: { label: "Developer / Programmer", family: "engineering", seniorityGate: false },
  tech_support_l1: { label: "Technical Support L1", family: "technical_support", seniorityGate: false },
  tech_support_l2: { label: "Technical Support L2", family: "technical_support", seniorityGate: false },
  tech_support_l3: { label: "Technical Support L3", family: "technical_support", seniorityGate: true },
  customer_support: { label: "Customer Support Specialist", family: "customer_service", seniorityGate: false },
  onboarding: { label: "Onboarding / Implementation Specialist", family: "implementation", seniorityGate: false },
  customer_success: { label: "Customer Success Manager", family: "customer_success", seniorityGate: false },
  account_manager: { label: "Account Manager", family: "account_management", seniorityGate: false },
  key_account_manager: { label: "Key Account Manager", family: "account_management", seniorityGate: true },
  sdr_bdr: { label: "SDR / BDR", family: "commercial", seniorityGate: false },
  account_executive: { label: "Account Executive", family: "commercial", seniorityGate: false },
  pre_sales: { label: "Pre-sales / Solutions Consultant", family: "commercial", seniorityGate: false },
  project_manager: { label: "Project Manager", family: "projects", seniorityGate: false },
  administrative_assistant: { label: "Administrative Assistant", family: "assistance", seniorityGate: false },
  executive_assistant: { label: "Executive Assistant", family: "assistance", seniorityGate: true },
  manager_team_lead: { label: "Manager / Team Lead", family: "leadership", seniorityGate: true },
};

export const DIMENSION_LABELS: Record<CareerDimension, string> = {
  technical_problem_solving: "resolución técnica",
  customer_orientation: "orientación al cliente",
  commercial_persuasion: "persuasión comercial",
  organization_execution: "organización y ejecución",
  analysis_precision: "análisis y precisión",
  explanatory_communication: "comunicación explicativa",
  ambiguity_tolerance: "tolerancia a la ambigüedad",
  leadership_coordination: "liderazgo y coordinación",
  autonomy: "autonomía",
  relational_preference: "preferencia relacional",
  troubleshooting: "troubleshooting",
  documentation: "documentación",
  negotiation: "negociación",
  stakeholder_management: "gestión de stakeholders",
  project_management: "gestión de proyectos",
  anticipation_service: "anticipación y servicio",
  resilience_rejection: "resiliencia al rechazo",
  teaching_adoption: "enseñanza y adopción",
  software_building: "construcción de software",
  escalation_depth: "profundidad de escalación",
  proactive_value: "generación proactiva de valor",
  prospecting: "prospección",
  closing: "cierre comercial",
  strategic_accounts: "gestión de cuentas estratégicas",
  executive_support: "soporte ejecutivo",
  people_management: "gestión de personas",
};

function confidenceBand(value: number) {
  if (value < 0.35) return "preliminary" as const;
  if (value < 0.65) return "medium" as const;
  return "strong" as const;
}

function topEvidenceDimensions(
  position: CareerPositionKey,
  scores: Partial<Record<CareerDimension, number>>,
  limit = 4,
) {
  const weights = POSITION_WEIGHTS[position];

  return (Object.entries(weights) as [CareerDimension, number][])
    .filter(([dimension]) => scores[dimension] != null)
    .map(([dimension, weight]) => ({
      dimension,
      contribution: (scores[dimension] ?? 0) * weight,
      score: scores[dimension] ?? 0,
    }))
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, limit);
}

export type CareerRecommendation = {
  position: CareerPositionKey;
  label: string;
  family: CareerFamilyKey;
  affinity: number;
  affinityPercent: number;
  confidence: number;
  confidenceBand: "preliminary" | "medium" | "strong";
  experienceGate: ExperienceGateStatus;
  reasons: { dimension: CareerDimension; label: string; score: number }[];
  practicallyTied: boolean;
};

export type CareerProfileResult = {
  modelVersion: string;
  confidence: number;
  confidenceBand: "preliminary" | "medium" | "strong";
  recommendations: CareerRecommendation[];
  hasPracticalTie: boolean;
  disclaimer: string;
};

export function buildCareerProfileResult(args: {
  dimensionScores: Partial<Record<CareerDimension, number>>;
  evidence: CareerEvidence[];
  experience?: ExperienceEvidence;
  topN?: number;
}): CareerProfileResult {
  const { dimensionScores, evidence, experience = {}, topN = 3 } = args;
  const ranked = rankPositions(dimensionScores);
  const confidence = calculateProfileConfidence(evidence);
  const band = confidenceBand(confidence);
  const selected = ranked.slice(0, topN);

  const recommendations = selected.map((item, index) => {
    const next = selected[index + 1];
    const prev = selected[index - 1];
    const tiedWithNext = next ? Math.abs(item.affinity - next.affinity) < 0.05 : false;
    const tiedWithPrev = prev ? Math.abs(item.affinity - prev.affinity) < 0.05 : false;
    const meta = CAREER_POSITION_META[item.position];

    const gate = meta.seniorityGate
      ? experienceGate(item.position, experience)
      : ("ready_now" as ExperienceGateStatus);

    return {
      position: item.position,
      label: meta.label,
      family: meta.family,
      affinity: item.affinity,
      affinityPercent: Math.round(item.affinity * 100),
      confidence,
      confidenceBand: band,
      experienceGate: gate,
      reasons: topEvidenceDimensions(item.position, dimensionScores).map((reason) => ({
        dimension: reason.dimension,
        label: DIMENSION_LABELS[reason.dimension],
        score: reason.score,
      })),
      practicallyTied: tiedWithNext || tiedWithPrev,
    };
  });

  return {
    modelVersion: CAREER_MODEL_VERSION,
    confidence,
    confidenceBand: band,
    recommendations,
    hasPracticalTie: recommendations.some((item) => item.practicallyTied),
    disclaimer:
      "Estas recomendaciones son orientativas. No son un diagnóstico psicológico ni una garantía de empleabilidad.",
  };
}
