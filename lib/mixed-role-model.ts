import {competencyProfile,type CompetencyEvidence,type JobProfile,type CompetencyKey} from './competency-matrix.ts';
export const WORK_TYPES=['tecnica','comercial','procesos','herramientas'] as const;
export type WorkType=typeof WORK_TYPES[number];
export const WORK_TYPE_NAMES={tecnica:'Técnica',comercial:'Comercial',procesos:'Procesos',herramientas:'Herramientas'} as const;
export const WORK_TYPE_ICONS={tecnica:'⌘',comercial:'↗',procesos:'⇄',herramientas:'▦'} as const;
export const COMPETENCY_WORK_TYPE:Record<CompetencyKey,WorkType>={
 technical:'tecnica',data:'tecnica',diagnosis:'tecnica',communication:'comercial',negotiation:'comercial',deescalation:'comercial',
 planning:'procesos',prioritization:'procesos',collaboration:'procesos',documentation:'herramientas',
};
export function mixedLevels(evidence:CompetencyEvidence[],profile:JobProfile|null,now=new Date()){
 const summary=competencyProfile(evidence,profile,now);
 return WORK_TYPES.map(type=>{
  const members=summary.competencies.filter(c=>COMPETENCY_WORK_TYPE[c.key]===type);
  return {type,name:WORK_TYPE_NAMES[type],level:Math.round(members.reduce((s,c)=>s+c.level,0)/members.length*100)/100,
   supported:members.every(c=>c.count>=3),competencies:members.map(c=>({key:c.key,level:c.level,count:c.count}))};
 });
}
export function mixedTeamLevels(rows:ReturnType<typeof mixedLevels>[]){
 return WORK_TYPES.map(type=>{
  const values=rows.map(row=>row.find(t=>t.type===type)!);
  return {type,level:values.length?Math.round(values.reduce((s,v)=>s+v.level,0)/values.length*100)/100:null,
   people:values.length,withEvidence:values.filter(v=>v.supported).length,belowTwo:values.filter(v=>v.supported&&v.level<2).length};
 });
}
export function lowestSupportedType(levels:ReturnType<typeof mixedLevels>){
 const supported=levels.filter(t=>t.supported);if(!supported.length)return [];
 const minimum=Math.min(...supported.map(t=>t.level));return supported.filter(t=>t.level===minimum).map(t=>t.type);
}
