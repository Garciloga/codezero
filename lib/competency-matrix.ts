import { ROLE_WORKFLOWS } from './career-role-workflows.ts';

export const COMPETENCIES = {
  communication: 'Comunicación con el cliente', diagnosis: 'Descubrimiento y diagnóstico',
  data: 'Datos y métricas', prioritization: 'Priorización y carga', documentation: 'Documentación y sistemas',
  deescalation: 'Objeciones y desescalamiento', negotiation: 'Negociación y criterio comercial',
  planning: 'Planeación, riesgos y seguimiento', technical: 'Conocimiento técnico y de producto', collaboration: 'Colaboración y traspasos',
} as const;
export type CompetencyKey = keyof typeof COMPETENCIES;
export const LEVEL_LABELS = ['Sin evidencia suficiente','Reconoce','Aplica con apoyo','Aplica solo','Sostiene'] as const;
export const ACTIVITY_WEIGHTS = { exercise: 1, deliverable: 3, project: 5, capstone: 8 } as const;
export type EvidenceKind = keyof typeof ACTIVITY_WEIGHTS;
export type CompetencyEvidence = {
  id: string; user_id: string; organization_id: string | null; activity_key: string; independent_key: string;
  kind: EvidenceKind; competency_scores: Partial<Record<CompetencyKey, number>>;
  assistance: 'recognition'|'guided'|'independent'; review_source: 'auto'|'self'|'manager'|'admin';
  observed_at: string; reevaluation_of?: string | null; critical_errors: string[]; feedback?: string | null; approval_submission_id?:string|null;
};
export type JobProfile = { position_key: string; version: number; weights: Record<CompetencyKey,'high'|'medium'|'low'>; expected: Record<CompetencyKey,number> };
const keys = Object.keys(COMPETENCIES) as CompetencyKey[];
/** Editorial defaults are separate from affinity weights and are always editable. */
const HIGH: Record<string, CompetencyKey[]> = {
 developer:['technical','diagnosis','documentation'], tech_support_l1:['diagnosis','communication','technical'],
 tech_support_l2:['diagnosis','technical','documentation'], tech_support_l3:['diagnosis','technical','planning'],
 customer_support:['communication','deescalation','documentation'], onboarding:['planning','collaboration','communication'],
 customer_success:['communication','diagnosis','data','planning','collaboration'], account_manager:['negotiation','communication','planning'],
 key_account_manager:['negotiation','planning','collaboration'], sdr_bdr:['communication','diagnosis','documentation'],
 account_executive:['negotiation','diagnosis','planning'], pre_sales:['technical','diagnosis','communication'],
 project_manager:['planning','prioritization','collaboration'], administrative_assistant:['documentation','prioritization','planning'],
 executive_assistant:['communication','prioritization','planning'], manager_team_lead:['collaboration','prioritization','planning'],
};
export const DEFAULT_JOB_PROFILES: JobProfile[] = Object.keys(ROLE_WORKFLOWS).map(position_key=>({
 position_key,version:1,
 weights:Object.fromEntries(keys.map(k=>[k,HIGH[position_key]?.includes(k)?'high':'medium'])) as JobProfile['weights'],
 expected:Object.fromEntries(keys.map(k=>[k,HIGH[position_key]?.includes(k)?3:2])) as JobProfile['expected'],
}));
export function validScores(value: unknown): value is CompetencyEvidence['competency_scores'] {
 if(!value || typeof value!=='object' || Array.isArray(value))return false;
 const entries=Object.entries(value);return entries.length>=1&&entries.length<=3&&entries.every(([k,v])=>k in COMPETENCIES&&Number.isInteger(v)&&Number(v)>=0&&Number(v)<=4);
}
function latestIndependent(evidence: CompetencyEvidence[], key: CompetencyKey, now: number) {
 const latest=new Map<string,CompetencyEvidence>();
 for(const e of evidence){
  const t=Date.parse(e.observed_at);const score=e.competency_scores[key];
  if(!Number.isFinite(t)||t>now||!Number.isInteger(score)||Number(score)<0||Number(score)>4||!(e.kind in ACTIVITY_WEIGHTS))continue;
  const old=latest.get(e.independent_key);
  const human=(v:CompetencyEvidence)=>v.review_source==='manager'||v.review_source==='admin';
  if(!old||(human(e)&&!human(old))||(human(e)===human(old)&&(t>Date.parse(old.observed_at)||(t===Date.parse(old.observed_at)&&e.id>old.id))))latest.set(e.independent_key,e);
 }
 return [...latest.values()];
}
export function summarizeCompetency(evidence: CompetencyEvidence[], key: CompetencyKey, now = new Date()) {
 const records=latestIndependent(evidence,key,now.getTime());
 const valid=records.filter(e=>!e.critical_errors.length);
 const weighted=(items:CompetencyEvidence[])=>{
  let total=0,weight=0;for(const e of items){const w=ACTIVITY_WEIGHTS[e.kind]*(now.getTime()-Date.parse(e.observed_at)<=90*86400000?2:1);total+=Number(e.competency_scores[key])*w;weight+=w;}
  return weight?Math.round(total/weight*100)/100:null;
 };
 let provisional=0,level=0;
 if(valid.filter(e=>Number(e.competency_scores[key])>=1).length>=3){
  provisional=1;
  if(valid.some(e=>e.kind!=='exercise'&&Number(e.competency_scores[key])>=2))provisional=2;
  const independent=valid.filter(e=>e.kind!=='exercise'&&e.assistance==='independent'&&Number(e.competency_scores[key])>=3);
  if(independent.length)provisional=3;
  const verified=independent.filter(e=>e.review_source==='manager'||e.review_source==='admin');
  level=verified.length?3:Math.min(provisional,valid.some(e=>e.review_source!=='self'&&e.kind!=='exercise'&&Number(e.competency_scores[key])>=2)?2:1);
  const capstone=verified.find(e=>e.kind==='capstone'&&e.review_source==='admin');
  const sustained=verified.some(e=>e.reevaluation_of&&evidence.some(base=>base.id===e.reevaluation_of&&base.user_id===e.user_id&&base.organization_id===e.organization_id&&base.assistance==='independent'&&['manager','admin'].includes(base.review_source)&&Number(base.competency_scores[key])>=3&&!base.critical_errors.length&&Date.parse(e.observed_at)-Date.parse(base.observed_at)>=30*86400000));
  if(capstone&&sustained)level=provisional=4;
 }
 const recent=valid.filter(e=>now.getTime()-Date.parse(e.observed_at)<=90*86400000);
 const previous=valid.filter(e=>now.getTime()-Date.parse(e.observed_at)>90*86400000&&now.getTime()-Date.parse(e.observed_at)<=180*86400000);
 const average=(items:CompetencyEvidence[])=>items.length>=3?items.reduce((s,e)=>s+Number(e.competency_scores[key])*ACTIVITY_WEIGHTS[e.kind],0)/items.reduce((s,e)=>s+ACTIVITY_WEIGHTS[e.kind],0):null;
 const a=average(recent),b=average(previous);
 return {key,name:COMPETENCIES[key],level,provisional,count:valid.length,label:LEVEL_LABELS[level],weightedScore:weighted(valid),
  trend90:a!==null&&b!==null?Math.round((a-b)*100)/100:null,
  evidence:records.sort((a,b)=>Date.parse(b.observed_at)-Date.parse(a.observed_at)),criticalErrors:records.filter(e=>e.critical_errors.length)};
}
export function competencyProfile(evidence:CompetencyEvidence[],profile:JobProfile|null,now=new Date()){
 const competencies=keys.map(k=>({...summarizeCompetency(evidence,k,now),weight:profile?.weights[k]??null,expected:profile?.expected[k]??null}));
 const strengths=competencies.filter(c=>c.level>=3&&c.count>=3).sort((a,b)=>b.level-a.level||a.name.localeCompare(b.name)).slice(0,3);
 const gaps=competencies.filter(c=>c.expected!==null&&c.level<c.expected).sort((a,b)=>(b.expected!-b.level)-(a.expected!-a.level)||a.name.localeCompare(b.name)).slice(0,3);
 return {competencies,strengths,gaps,questions:[
  strengths[0]?`¿Qué decisión de ${strengths[0].name.toLowerCase()} puedes explicar con su evidencia?`:'¿Qué práctica te ayudaría a reunir tus primeras evidencias?',
  gaps[0]?`¿Qué apoyo necesitas para practicar ${gaps[0].name.toLowerCase()}?`:'¿En qué situación nueva pondrías a prueba lo aprendido?',
  '¿Qué error o supuesto cambiaste y cómo comprobarás el resultado en tu siguiente intento?',
 ]};
}
