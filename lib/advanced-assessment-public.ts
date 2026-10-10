// Public identifiers and sequence only. Grading rules, critical errors and
// scenario consequences remain server-side in advanced-assessment.ts.
export const ADVANCED_OPTION_IDS={
  intake:["triage","exec","quickfix","freeze"],
  diagnosis:["cohort","interview","report","permissions"],
  stakeholders:["charter","sponsor","procurement","delegate"],
  tradeoff:["scoped","pilot","build","promise"],
  finance:["value","commercial","flat","invent"],
  crisis:["recovery","breach","discount","conceal"],
  evidence:["reconcile","sample","aggregate","omit"],
  renewal:["conditional","short","rebate","pressure"],
  transfer:["disclose","audit","internal","suppress"],
} as const;
export type AdvancedSceneKey=keyof typeof ADVANCED_OPTION_IDS;
