import framework from './position-curricula/application-framework.json' with {type:'json'};
import type {TrainingActivity} from './role-training-content.ts';
export type PositionApplication={rule:string;evidence:string;process:string;task:string;template:string;example:string;case?:string;decisions:TrainingActivity['decisions']};
export function makePositionApplication(title:Record<string,string>,data:{rule:Record<string,string>;evidence:Record<string,string>;case?:Record<string,string>;process?:Record<string,string>},seed:number):Record<string,PositionApplication>{
 return Object.fromEntries((['es','en','pt','fr'] as const).map(locale=>{
  const f=framework[locale],rule=data.rule[locale],evidence=data.evidence[locale],fmt=(s:string)=>s.replaceAll('{title}',title[locale]).replaceAll('{rule}',rule).replaceAll('{evidence}',evidence);
  const questions=[{prompt:fmt(f.q1),options:[rule,f.bad1,f.bad2],correct:0,feedback:fmt(f.feedback1)},{prompt:fmt(f.q2),options:[f.bad3,evidence,f.bad2],correct:1,feedback:fmt(f.feedback2)}].map((q,n)=>{const shift=(seed+n)%3;return {...q,options:[...q.options.slice(shift),...q.options.slice(0,shift)],correct:(q.correct-shift+3)%3};});
  return [locale,{rule,evidence,process:data.process?.[locale]??f.process,task:fmt(f.task),template:fmt(f.template),example:fmt(f.example),...(data.case?{case:data.case[locale]}:{}),decisions:questions}];
 }));
}
