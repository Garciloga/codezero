import { aggregateDimensions, analyzeDimensionTension, CAREER_DIMENSIONS, POSITION_WEIGHTS, rankPositions } from "./career-guidance.ts";
import type { CareerDimension, CareerEvidence, CareerPositionKey, ExperienceEvidence } from "./career-guidance.ts";
import { CAREER_DISCRIMINATORS, chooseNextAdaptiveStep } from "./career-guidance-adaptive.ts";
import { buildCareerProfileResult, CAREER_POSITION_META, CAREER_MODEL_VERSION } from "./career-guidance-results.ts";
import { BASE_DIMENSIONS, LAB_ACTIVITIES, ROLE_PRACTICES } from "./career-lab-catalog.ts";
export type LabAnswer = { key:string; option:number };
export type LabRequest = { version: string; synthetic: true; enabled: true; mode:"guided"|"fixture"; answers:LabAnswer[]; fixture?: string; experience:"unknown"|"limited"|"established" };
const positions = Object.keys(POSITION_WEIGHTS) as CareerPositionKey[];
export const LAB_FIXTURES = [
...positions.flatMap((position,i)=>[
{ key:position, label:CAREER_POSITION_META[position].label+" · canónico" },
{ key:"blend:"+position, label:CAREER_POSITION_META[position].label+" · frontera con "+CAREER_POSITION_META[positions[(i+1)%positions.length]].label }
]), { key:"empty",label:"Sin evidencia" },{ key:"sparse",label:"Evidencia escasa" },{ key:"tension",label:"Desempeño y preferencia en conflicto" }
];
export function validateLabRequest(value:unknown):LabRequest {
 if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("INVALID_LAB_REQUEST");
 const v=value as Record<string,unknown>;
 if(Object.keys(v).some(k=>!["version","synthetic","enabled","mode","answers","fixture","experience"].includes(k))) throw Error("INVALID_LAB_REQUEST");
 if(v.version!==CAREER_MODEL_VERSION) throw Error("CAREER_MODEL_CHANGED");
 if(v.synthetic!==true || v.enabled!==true) throw Error("SYNTHETIC_MODE_REQUIRED");
 if(!["guided","fixture"].includes(String(v.mode)) || !["unknown","limited","established"].includes(String(v.experience))) throw Error("INVALID_LAB_REQUEST");
 if(!Array.isArray(v.answers)||v.answers.length>11) throw Error("INVALID_LAB_REQUEST");
 for(const a of v.answers) if(!a || typeof a!=="object" || Object.keys(a).some(k=>!["key","option"].includes(k)) || typeof a.key!=="string" || !Number.isInteger(a.option) || a.option<0 || a.option>3) throw Error("INVALID_ACTIVITY_RESPONSE");
 if(v.mode==="fixture" && (!LAB_FIXTURES.some(f=>f.key===v.fixture)||v.answers.length)) throw Error("INVALID_LAB_REQUEST");
 if(v.mode==="guided" && v.fixture!==undefined) throw Error("INVALID_LAB_REQUEST");
 return v as unknown as LabRequest;
}
function syntheticExperience(key:LabRequest["experience"]):ExperienceEvidence {
 if(key==="unknown") return {};
 const yes=key==="established";
 return {technicalYears:yes?3:0,commercialYears:yes?3:0,managedComplexAccounts:yes,ledPeople:yes,ownedProcessOrKpi:yes,handledEscalations:yes,supportedExecutives:yes,handledConfidentialInfo:yes,advancedDebuggingEvidence:yes};
}
function canonical(position:CareerPositionKey):Record<CareerDimension,number> {
 return Object.fromEntries(CAREER_DIMENSIONS.map(d=>[d,POSITION_WEIGHTS[position][d]===undefined?0:.45+POSITION_WEIGHTS[position][d]!* .55])) as Record<CareerDimension,number>;
}
function fixtureEvidence(key:string):CareerEvidence[] {
 if(key==="empty") return [];
 if(key==="sparse") return [{dimension:"organization_execution",value:.85,source:"behavior",activityKey:"sparse"}];
 if(key==="tension") return [
 {dimension:"technical_problem_solving",value:.92,source:"behavior",activityKey:"t1"},
 {dimension:"technical_problem_solving",value:.88,source:"performance",activityKey:"t2"},
 {dimension:"technical_problem_solving",value:.2,source:"preference",activityKey:"t3"}];
 const position=key.replace("blend:","") as CareerPositionKey;
 const scores=canonical(position), neighbor=canonical(positions[(positions.indexOf(position)+1)%positions.length]);
 return CAREER_DIMENSIONS.flatMap((dimension,i)=>[0,1].map(j=>({dimension,value:key.startsWith("blend:")?scores[dimension]*.6+neighbor[dimension]*.4:scores[dimension],source:"performance" as const,activityKey:"fixture-"+((i+j)%8)})));
}
function nextStep(evidence:CareerEvidence[], completedBaseActivities:number, completedDiscriminators:string[]) {
 return chooseNextAdaptiveStep(rankPositions(aggregateDimensions(evidence).scores), {completedBaseActivities,completedDiscriminators:completedDiscriminators as Parameters<typeof chooseNextAdaptiveStep>[1]["completedDiscriminators"]});
}
export function runCareerLab(request:LabRequest) {
 const evidence:CareerEvidence[]=request.mode==="fixture"?fixtureEvidence(request.fixture!):[];
 const completed:string[]=[];let base=0;
 for(const answer of request.answers) {
  const expected=nextStep(evidence,base,completed);
  if(expected.kind==="result") throw Error("CAREER_ACTIVITY_NOT_EXPECTED");
  const key=expected.kind==="base"?LAB_ACTIVITIES[base].key:expected.discriminator.key;
  if(answer.key!==key) throw Error("CAREER_ACTIVITY_NOT_EXPECTED");
  if(expected.kind==="base") {
   const activity=LAB_ACTIVITIES[base];
   if(answer.option>=activity.options.length) throw Error("INVALID_ACTIVITY_RESPONSE");
   if(base===7) evidence.push({dimension:BASE_DIMENSIONS[7][answer.option],value:.85,source:"preference",activityKey:key});
   else for(const dimension of BASE_DIMENSIONS[base]) evidence.push({dimension,value:[.85,.4,.15][answer.option],source:"performance",activityKey:key});
   base++;
  } else {
   if(answer.option>1) throw Error("INVALID_ACTIVITY_RESPONSE");
   const selected=expected.discriminator.positions[answer.option], other=expected.discriminator.positions[1-answer.option];
   for(const dimension of CAREER_DIMENSIONS) {
    const a=POSITION_WEIGHTS[selected][dimension]??0,b=POSITION_WEIGHTS[other][dimension]??0;
    if(Math.abs(a-b)>.2) evidence.push({dimension,value:a > b ? 0.85 : 0.35,source:"preference",activityKey:key});
   }
   completed.push(key);
  }
 }
 const {scores,maturity}=aggregateDimensions(evidence);
 const next=request.mode==="fixture"?{kind:"result" as const,reason:"fixture"}:nextStep(evidence,base,completed);
 const raw=buildCareerProfileResult({dimensionScores:scores,evidence,experience:syntheticExperience(request.experience),topN:16});
 // Preserve all scores internally, but management is never an entry diagnostic recommendation.
 const candidates=raw.recommendations.filter(r=>r.reasons.length>0&&r.position!=="manager_team_lead");
 const recommendations=evidence.length?candidates.slice(0,3):[];
 const catalog=raw.recommendations.map(r=>({...r,coverage:Object.keys(POSITION_WEIGHTS[r.position]).filter(d=>scores[d as CareerDimension]!==undefined).length,Objective:"orientación",progression:r.position==="manager_team_lead"}));
 const activity=next.kind==="base"?LAB_ACTIVITIES[base]:next.kind==="discriminator"?{
  key:next.discriminator.key,title:next.discriminator.title,scenario:next.discriminator.goal+" Elige qué trabajo prefiere el personaje ficticio.",
  options:next.discriminator.positions.map(p=>ROLE_PRACTICES[p].task),
  lesson:"Esta comparación aporta preferencia declarada, no prueba de desempeño ni de seniority."
 }:null;
 return {modelVersion:CAREER_MODEL_VERSION,synthetic:true,completedBase:base,completedExtra:completed.length,next,activity,
 result:next.kind==="result"?{...raw,recommendations,hasPracticalTie:recommendations.some(r=>r.practicallyTied)}:null,
 catalog:next.kind==="result"?catalog:[],dimensions:next.kind==="result"?CAREER_DIMENSIONS.filter(d=>scores[d]!==undefined).map(d=>({dimension:d,score:scores[d]!,maturity:maturity[d],tension:analyzeDimensionTension(evidence,d)})):[],
 evidenceCount:evidence.length,lessons:request.answers.map(a=>({key:a.key,lesson:LAB_ACTIVITIES.find(x=>x.key===a.key)?.lesson??"La preferencia orienta exploración; valida habilidad con una práctica posterior."}))};
}
export type LabResponse=ReturnType<typeof runCareerLab>;
