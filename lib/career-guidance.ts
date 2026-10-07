export const CAREER_DIMENSIONS = [
  "technical_problem_solving",
  "customer_orientation",
  "commercial_persuasion",
  "organization_execution",
  "analysis_precision",
  "explanatory_communication",
  "ambiguity_tolerance",
  "leadership_coordination",
  "autonomy",
  "relational_preference",
  "troubleshooting",
  "documentation",
  "negotiation",
  "stakeholder_management",
  "project_management",
  "anticipation_service",
  "resilience_rejection",
  "teaching_adoption",
  "software_building",
  "escalation_depth",
  "proactive_value",
  "prospecting",
  "closing",
  "strategic_accounts",
  "executive_support",
  "people_management",
] as const;

export type CareerDimension = typeof CAREER_DIMENSIONS[number];

export type CareerPositionKey =
  | "developer"
  | "tech_support_l1"
  | "tech_support_l2"
  | "tech_support_l3"
  | "customer_support"
  | "onboarding"
  | "customer_success"
  | "account_manager"
  | "key_account_manager"
  | "sdr_bdr"
  | "account_executive"
  | "pre_sales"
  | "project_manager"
  | "administrative_assistant"
  | "executive_assistant"
  | "manager_team_lead";

type WeightMap = Partial<Record<CareerDimension, number>>;

export type CareerEvidence = {
  dimension: CareerDimension;
  value: number;
  source: "behavior" | "performance" | "preference" | "self_report";
  activityKey: string;
  ageDays?: number;
  confidence?: number;
};

export type ExperienceEvidence = {
  technicalYears?: number;
  commercialYears?: number;
  managedComplexAccounts?: boolean;
  ledPeople?: boolean;
  ownedProcessOrKpi?: boolean;
  handledEscalations?: boolean;
  supportedExecutives?: boolean;
  handledConfidentialInfo?: boolean;
  advancedDebuggingEvidence?: boolean;
};

export const POSITION_WEIGHTS: Record<CareerPositionKey, WeightMap> = {
  developer: {
    technical_problem_solving: 1, analysis_precision: 1, autonomy: .9,
    ambiguity_tolerance: .6, documentation: .5, software_building: 1,
    troubleshooting: .4, customer_orientation: .1,
  },
  tech_support_l1: {
    troubleshooting: 1, customer_orientation: .8, explanatory_communication: .8,
    documentation: .8, organization_execution: .6, analysis_precision: .6,
    technical_problem_solving: .6, autonomy: .5,
  },
  tech_support_l2: {
    troubleshooting: 1, technical_problem_solving: .95, analysis_precision: .9,
    autonomy: .8, customer_orientation: .65, explanatory_communication: .7,
    documentation: .75, escalation_depth: .6, ambiguity_tolerance: .7,
  },
  tech_support_l3: {
    technical_problem_solving: 1, troubleshooting: 1, analysis_precision: 1,
    autonomy: .95, escalation_depth: 1, documentation: .8,
    explanatory_communication: .55, leadership_coordination: .35,
  },
  customer_support: {
    customer_orientation: 1, explanatory_communication: 1, organization_execution: .75,
    ambiguity_tolerance: .7, documentation: .65, analysis_precision: .45,
    troubleshooting: .35, autonomy: .5,
  },
  onboarding: {
    organization_execution: 1, customer_orientation: .9, teaching_adoption: 1,
    explanatory_communication: .9, project_management: .8, stakeholder_management: .65,
    technical_problem_solving: .45, ambiguity_tolerance: .75,
  },
  customer_success: {
    customer_orientation: 1, proactive_value: 1, analysis_precision: .75,
    explanatory_communication: .8, stakeholder_management: .8,
    organization_execution: .65, commercial_persuasion: .45, ambiguity_tolerance: .7,
  },
  account_manager: {
    commercial_persuasion: .9, customer_orientation: .85, negotiation: .9,
    stakeholder_management: .75, organization_execution: .65, closing: .65,
    proactive_value: .45, analysis_precision: .5,
  },
  key_account_manager: {
    strategic_accounts: 1, stakeholder_management: 1, negotiation: .95,
    commercial_persuasion: .8, ambiguity_tolerance: .8, analysis_precision: .65,
    leadership_coordination: .55, customer_orientation: .75,
  },
  sdr_bdr: {
    prospecting: 1, resilience_rejection: 1, commercial_persuasion: .85,
    explanatory_communication: .7, autonomy: .7, organization_execution: .55,
    closing: .2,
  },
  account_executive: {
    closing: 1, negotiation: .9, commercial_persuasion: .95,
    customer_orientation: .7, ambiguity_tolerance: .7, organization_execution: .6,
    prospecting: .5, stakeholder_management: .55,
  },
  pre_sales: {
    technical_problem_solving: .85, explanatory_communication: 1,
    customer_orientation: .8, commercial_persuasion: .6, analysis_precision: .75,
    teaching_adoption: .7, troubleshooting: .6, closing: .35,
  },
  project_manager: {
    project_management: 1, organization_execution: 1, stakeholder_management: .9,
    ambiguity_tolerance: .8, leadership_coordination: .75,
    explanatory_communication: .65, analysis_precision: .7,
  },
  administrative_assistant: {
    organization_execution: 1, analysis_precision: .9, anticipation_service: .8,
    explanatory_communication: .55, autonomy: .6, stakeholder_management: .4,
  },
  executive_assistant: {
    executive_support: 1, anticipation_service: 1, organization_execution: .95,
    stakeholder_management: .85, ambiguity_tolerance: .75,
    explanatory_communication: .65, autonomy: .8, analysis_precision: .8,
  },
  manager_team_lead: {
    people_management: 1, leadership_coordination: 1, stakeholder_management: .85,
    explanatory_communication: .8, ambiguity_tolerance: .8,
    organization_execution: .75, analysis_precision: .65, autonomy: .8,
  },
};

const sourceWeight: Record<CareerEvidence["source"], number> = {
  behavior: 1,
  performance: 1,
  preference: .6,
  self_report: .35,
};

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function recencyFactor(ageDays = 0) {
  if (ageDays <= 30) return 1;
  if (ageDays <= 90) return .9;
  if (ageDays <= 180) return .8;
  return .7;
}

export function aggregateDimensions(evidence: CareerEvidence[]) {
  const buckets = new Map<CareerDimension, { sum: number; weight: number; count: number; activities: Set<string>; strong: number }>();

  for (const item of evidence) {
    const bucket = buckets.get(item.dimension) ?? { sum: 0, weight: 0, count: 0, activities: new Set<string>(), strong: 0 };
    const weight = sourceWeight[item.source] * recencyFactor(item.ageDays) * clamp(item.confidence ?? 1);
    bucket.sum += clamp(item.value) * weight;
    bucket.weight += weight;
    bucket.count += 1;
    bucket.activities.add(item.activityKey);
    if (item.source === "behavior" || item.source === "performance") bucket.strong += 1;
    buckets.set(item.dimension, bucket);
  }

  const scores: Partial<Record<CareerDimension, number>> = {};
  const maturity: Partial<Record<CareerDimension, "preliminary" | "stable">> = {};

  for (const [dimension, bucket] of buckets) {
    scores[dimension] = bucket.weight ? bucket.sum / bucket.weight : 0;
    maturity[dimension] =
      bucket.count >= 3 && bucket.activities.size >= 2 && bucket.strong >= 1
        ? "stable"
        : "preliminary";
  }

  return { scores, maturity };
}

export function scorePosition(
  dimensionScores: Partial<Record<CareerDimension, number>>,
  position: CareerPositionKey,
) {
  const weights = POSITION_WEIGHTS[position];
  let numerator = 0;
  let denominator = 0;

  for (const [dimension, weight] of Object.entries(weights) as [CareerDimension, number][]) {
    if (dimensionScores[dimension] == null) continue;
    numerator += clamp(dimensionScores[dimension]!) * weight;
    denominator += weight;
  }

  return denominator ? numerator / denominator : 0;
}

export function rankPositions(dimensionScores: Partial<Record<CareerDimension, number>>) {
  return (Object.keys(POSITION_WEIGHTS) as CareerPositionKey[])
    .map((position) => ({ position, affinity: scorePosition(dimensionScores, position) }))
    .sort((a, b) => b.affinity - a.affinity);
}

export function practicalTie(a: number, b: number, threshold = .05) {
  return Math.abs(a - b) < threshold;
}

export function calculateProfileConfidence(evidence: CareerEvidence[]) {
  if (evidence.length === 0) return 0;
  const activities = new Set(evidence.map((e) => e.activityKey)).size;
  const strong = evidence.filter((e) => e.source === "behavior" || e.source === "performance").length;
  const evidenceFactor = Math.min(1, evidence.length / 18);
  const diversityFactor = Math.min(1, activities / 6);
  const strongFactor = Math.min(1, strong / 8);
  return clamp(evidenceFactor * .35 + diversityFactor * .35 + strongFactor * .30);
}

export type ExperienceGateStatus =
  | "ready_now"
  | "near_ready"
  | "future_progression"
  | "insufficient_evidence";

export function experienceGate(
  position: CareerPositionKey,
  evidence: ExperienceEvidence,
): ExperienceGateStatus {
  const present = Object.values(evidence).filter((v) => v !== undefined).length;
  if (present === 0) return "insufficient_evidence";

  if (position === "tech_support_l3") {
    const signals = [
      (evidence.technicalYears ?? 0) >= 1,
      evidence.advancedDebuggingEvidence === true,
      evidence.handledEscalations === true,
    ].filter(Boolean).length;
    return signals >= 2 ? "ready_now" : signals === 1 ? "near_ready" : "future_progression";
  }

  if (position === "key_account_manager") {
    const signals = [
      evidence.managedComplexAccounts === true,
      (evidence.commercialYears ?? 0) >= 1,
      evidence.ownedProcessOrKpi === true,
    ].filter(Boolean).length;
    return signals >= 2 ? "ready_now" : signals === 1 ? "near_ready" : "future_progression";
  }

  if (position === "executive_assistant") {
    const signals = [
      evidence.supportedExecutives === true,
      evidence.handledConfidentialInfo === true,
      evidence.ownedProcessOrKpi === true,
    ].filter(Boolean).length;
    return signals >= 2 ? "ready_now" : signals === 1 ? "near_ready" : "future_progression";
  }

  if (position === "manager_team_lead") {
    const signals = [
      evidence.ledPeople === true,
      evidence.ownedProcessOrKpi === true,
      evidence.managedComplexAccounts === true,
    ].filter(Boolean).length;
    return signals >= 2 ? "ready_now" : signals === 1 ? "near_ready" : "future_progression";
  }

  return "ready_now";
}


export type DimensionTension = {
  dimension: CareerDimension;
  capabilityScore: number | null;
  preferenceScore: number | null;
  gap: number | null;
  status: "insufficient" | "aligned" | "mixed";
};

export function analyzeDimensionTension(
  evidence: CareerEvidence[],
  dimension: CareerDimension,
  threshold = .35,
): DimensionTension {
  const relevant = evidence.filter((item) => item.dimension === dimension);
  const capability = relevant.filter(
    (item) => item.source === "behavior" || item.source === "performance",
  );
  const preference = relevant.filter(
    (item) => item.source === "preference" || item.source === "self_report",
  );

  const average = (items: CareerEvidence[]) => {
    if (items.length === 0) return null;
    return items.reduce((sum, item) => sum + clamp(item.value), 0) / items.length;
  };

  const capabilityScore = average(capability);
  const preferenceScore = average(preference);

  if (capability.length < 2 || preference.length < 1) {
    return {
      dimension,
      capabilityScore,
      preferenceScore,
      gap: null,
      status: "insufficient",
    };
  }

  const gap = Math.abs((capabilityScore ?? 0) - (preferenceScore ?? 0));
  return {
    dimension,
    capabilityScore,
    preferenceScore,
    gap,
    status: gap > threshold ? "mixed" : "aligned",
  };
}
