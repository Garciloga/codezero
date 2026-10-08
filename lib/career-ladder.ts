import {COMPETENCIES,type JobProfile,type competencyProfile} from './competency-matrix.ts';
export const CAREER_STEPS=['Inicial','Autónomo','Senior','Supervisión','Gerencia','Dirección'] as const;
/** Provisional educational milestones reuse each published job profile, never grant a title. */
export function careerLadder(summary:ReturnType<typeof competencyProfile>,profile:JobProfile){
 const keys=Object.keys(COMPETENCIES) as (keyof typeof COMPETENCIES)[];
 const stages=CAREER_STEPS.map((name,i)=>({name,expected:Object.fromEntries(keys.map(k=>[k,Math.min(4,Math.max(1,(profile.expected[k]??2)+[-2,-1,0,0,1,1][i]+(i>=3&&['planning','collaboration','prioritization'].includes(k)?1:0)))])) as JobProfile['expected']}));
 const meets=(s:typeof stages[number])=>keys.every(k=>{const c=summary.competencies.find(c=>c.key===k)!;return c.count>=3&&c.level>=s.expected[k];});
 const current=stages.reduce((n,s,i)=>meets(s)?i:n,-1),next=Math.min(current+1,stages.length-1);
 const gaps=keys.filter(k=>{const c=summary.competencies.find(c=>c.key===k)!;return c.count<3||c.level<stages[next].expected[k];});
 return {stages,current,next,gaps};
}
