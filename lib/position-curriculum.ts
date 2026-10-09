import framework from './position-curricula/application-framework.json' with {type:'json'};
import transferBank from './position-curricula/exam-transfer.json' with {type:'json'};
import projectTitles from './position-curricula/projects.json' with {type:'json'};
import levels from './position-curricula/customer-success.json' with {type:'json'};
import applications from './position-curricula/cs-lesson-applications.json' with {type:'json'};
import {makePositionApplication,type PositionApplication} from './position-application.ts';
import optionalTechnical from './position-curricula/optional-technical.json' with {type:'json'};
import {TRAINING_UNITS,TRAINING_EXTRAS,type TrainingActivity} from './role-training-content.ts';
import type {CompetencyKey,CompetencyEvidence} from './competency-matrix.ts';
export type {PositionApplication} from './position-application.ts';
export type PositionItem={key:string;position:string;level:number;lesson:number|null;type:'lesson'|'exam'|'project'|'diagnostic'|'optional';source:TrainingActivity;title:Record<string,string>;decisions:TrainingActivity['decisions'];application?:Record<string,PositionApplication>;required:boolean;hours:number};
const sources=[...TRAINING_UNITS,...TRAINING_EXTRAS];
function source(key:string){const a=sources.find(a=>a.key===key);if(!a)throw Error('MISSING_SOURCE:'+key);return a;}
export const CS_CURRICULUM_LEVELS=levels;
export const CS_CURRICULUM_LESSONS:PositionItem[]=levels.flatMap(l=>l.topics.map((title,i)=>{
 const key=`position-cs-l${l.number}-${i+1}`,data=applications.find(a=>a.key===key);if(!data)throw Error('MISSING_APPLICATION:'+key);
 const application=makePositionApplication(title,{...data,...(l.number===1?{case:Object.fromEntries(Object.entries(framework).map(([locale,f])=>[locale,f.businessCase]))}:{})},l.number+i);
 return {key,position:'customer_success',level:l.number,lesson:i+1,type:'lesson' as const,source:source(l.source),title,application,decisions:application.es.decisions,required:true,hours:1.5};
}));
export const CS_CURRICULUM_EXAMS:PositionItem[]=levels.map(l=>{
 const base=source(l.source);
 const questions=[...base.decisions,...transferBank[l.number-1].map(q=>({...q.es,correct:0}))].map((q,i)=>{const shift=(l.number+i)%q.options.length;return {...q,options:[...q.options.slice(shift),...q.options.slice(0,shift)],correct:(q.correct-shift+q.options.length)%q.options.length};});
 return {key:`position-cs-exam-${l.number}`,position:'customer_success',level:l.number,lesson:null,type:'exam',source:base,title:l.title,decisions:questions,required:true,hours:0.5};
});
export const CS_CURRICULUM_PROJECTS:PositionItem[]=[{key:'position-cs-project-8',position:'customer_success',level:8,lesson:null,type:'project',source:source('cs-project-adoption'),title:projectTitles[0],decisions:[],required:true,hours:8},{key:'position-cs-project-15',position:'customer_success',level:15,lesson:null,type:'project',source:source('cs-project-continuity'),title:projectTitles[1],decisions:[],required:true,hours:12}];
const diagnosisSources=['common-communication','common-diagnosis','common-data','common-priority','common-documentation','common-deescalation','common-commercial','common-planning','common-technical','cs-stakeholders'];
const diagnosisKeys:CompetencyKey[]=['communication','diagnosis','data','prioritization','documentation','deescalation','negotiation','planning','technical','collaboration'];
export const POSITION_DIAGNOSTICS:PositionItem[]=diagnosisSources.map((key,i)=>{const a=source(key);return {key:'position-diagnostic-'+diagnosisKeys[i],position:'common',level:0,lesson:null,type:'diagnostic',source:{...a,competencies:[diagnosisKeys[i]]},title:{es:a.title,en:a.title,pt:a.title,fr:a.title},decisions:a.decisions,required:false,hours:0.1};});
export const CS_CURRICULUM_OPTIONAL:PositionItem[]=['common-data','common-technical','cs-integration','common-documentation'].map((key,i)=>{const a=source(key),data=optionalTechnical[i],application=makePositionApplication(data.title,data,i);return {key:'position-cs-optional-'+i,position:'customer_success',level:0,lesson:null,type:'optional',source:a,title:data.title,application,decisions:application.es.decisions,required:false,hours:1};});
export const POSITION_ITEMS=[...CS_CURRICULUM_LESSONS,...CS_CURRICULUM_EXAMS,...CS_CURRICULUM_PROJECTS,...POSITION_DIAGNOSTICS,...CS_CURRICULUM_OPTIONAL];
export function positionItem(key:string){return POSITION_ITEMS.find(a=>a.key===key);}
export function positionProjectApproved(evidence:CompetencyEvidence[],key:string,org:string|null){
 const human=evidence.filter(e=>e.organization_id===org&&e.activity_key===key&&['manager','admin'].includes(e.review_source)).sort((a,b)=>Date.parse(b.observed_at)-Date.parse(a.observed_at)||b.id.localeCompare(a.id));
 const latest=human[0];return Boolean(latest&&!latest.critical_errors.length&&Object.values(latest.competency_scores).every(v=>Number(v)>=3));
}
export function positionGrade(item:PositionItem,answers:number[]){if(answers.length!==item.decisions.length||answers.some((v,i)=>!Number.isInteger(v)||v<0||v>=item.decisions[i].options.length))throw Error('INVALID_ANSWERS');return answers.map((v,i)=>v===item.decisions[i].correct?1:0);}
