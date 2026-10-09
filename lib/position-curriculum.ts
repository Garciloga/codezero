import framework from './position-curricula/application-framework.json' with {type:'json'};
import transferBank from './position-curricula/exam-transfer.json' with {type:'json'};
import projectTitles from './position-curricula/projects.json' with {type:'json'};
import levels from './position-curricula/customer-success.json' with {type:'json'};
import applications from './position-curricula/cs-lesson-applications.json' with {type:'json'};
import {makePositionApplication,type PositionApplication} from './position-application.ts';
import optionalTechnical from './position-curricula/optional-technical.json' with {type:'json'};
import {TRAINING_UNITS,TRAINING_EXTRAS,type TrainingActivity} from './role-training-content.ts';
import type {CompetencyKey,CompetencyEvidence} from './competency-matrix.ts';
import onboardingRole from './position-curricula/roles/onboarding.json' with {type:'json'};
export type {PositionApplication} from './position-application.ts';
export type PositionItem={key:string;position:string;level:number;lesson:number|null;type:'lesson'|'exam'|'project'|'diagnostic'|'optional';source:TrainingActivity;title:Record<string,string>;decisions:TrainingActivity['decisions'];application?:Record<string,PositionApplication>;brief?:Record<string,string>;required:boolean;hours:number};
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

/*
 * Role curricula beyond Customer Success.
 *
 * Each role is one JSON file in position-curricula/roles with fifteen levels. A lesson carries its own
 * scenario, one three-option decision and a written deliverable; a level ends with a five-question exam.
 * The level's shared source activity supplies competencies, rubric and references, as in Customer Success.
 */
const LOCALES=['es','en','pt','fr'] as const;
type RoleDecision={prompt:string;options:string[];correctIndex:number;feedback:string};
type RoleLesson={key:string;sharedSource:string;localized:Record<string,{title:string;learningObjective:string;case:string;exercise1:RoleDecision;exercise2:{prompt:string}}>};
type RoleLevel={number:number;source:string;title:Record<string,string>;lessons:RoleLesson[];assessment:{questions:{key:string;localized:Record<string,RoleDecision>}[]}};
type RoleData={role:string;title:string;projects:{level:number;title:Record<string,string>;brief?:Record<string,string>}[];levels:RoleLevel[]};
const decision=(q:RoleDecision)=>({prompt:q.prompt,options:q.options,correct:q.correctIndex,feedback:q.feedback});
const fill=(text:string,title:string,rule:string,evidence:string)=>text.replaceAll('{title}',title).replaceAll('{rule}',rule).replaceAll('{evidence}',evidence);
function roleLessonApplication(lesson:RoleLesson):Record<string,PositionApplication>{
 return Object.fromEntries(LOCALES.map(locale=>{
  const f=framework[locale],text=lesson.localized[locale],rule=text.learningObjective,evidence=text.exercise2.prompt;
  return [locale,{rule,evidence,process:f.process,task:fill(f.task,text.title,rule,evidence),template:fill(f.template,text.title,rule,evidence),example:fill(f.example,text.title,rule,evidence),case:text.case,decisions:[decision(text.exercise1)]}];
 }));
}
/** Exams reuse the application slot only to carry each language's questions. */
function roleExamApplication(level:RoleLevel):Record<string,PositionApplication>{
 return Object.fromEntries(LOCALES.map(locale=>[locale,{rule:'',evidence:'',process:'',task:'',template:'',example:'',decisions:level.assessment.questions.map(q=>decision(q.localized[locale]))}]));
}
export type PositionProgram={key:string;title:string;levels:{number:number;title:Record<string,string>}[];lessons:PositionItem[];exams:PositionItem[];projects:PositionItem[];optional:PositionItem[];certificateType:string;editorialReview:'pending'|'approved'};
function roleProgram(data:RoleData,certificateType:string,projectSources:[string,string]):PositionProgram{
 const lessons=data.levels.flatMap(level=>level.lessons.map((lesson,i):PositionItem=>{const application=roleLessonApplication(lesson);
  return {key:lesson.key,position:data.role,level:level.number,lesson:i+1,type:'lesson',source:source(lesson.sharedSource),title:Object.fromEntries(LOCALES.map(l=>[l,lesson.localized[l].title])),application,decisions:application.es.decisions,required:true,hours:1.5};}));
 const exams=data.levels.map((level):PositionItem=>{const application=roleExamApplication(level);
  return {key:`position-${data.role}-exam-${level.number}`,position:data.role,level:level.number,lesson:null,type:'exam',source:source(level.source),title:level.title,application,decisions:application.es.decisions,required:true,hours:0.5};});
 const projects=data.projects.map((project,i):PositionItem=>({key:`position-${data.role}-project-${project.level}`,position:data.role,level:project.level,lesson:null,type:'project',source:source(projectSources[i]),title:project.title,brief:project.brief,decisions:[],required:true,hours:i?12:8}));
 return {key:data.role,title:data.title,levels:data.levels.map(l=>({number:l.number,title:l.title})),lessons,exams,projects,optional:[],certificateType,editorialReview:'pending'};
}
export const ONBOARDING_PROGRAM=roleProgram(onboardingRole as RoleData,'onboarding-positions-v1',['cs-project-adoption','cs-project-continuity']);
export const POSITION_PROGRAMS:Record<string,PositionProgram>={
 customer_success:{key:'customer_success',title:'Customer Success',levels:CS_CURRICULUM_LEVELS,lessons:CS_CURRICULUM_LESSONS,exams:CS_CURRICULUM_EXAMS,projects:CS_CURRICULUM_PROJECTS,optional:CS_CURRICULUM_OPTIONAL,certificateType:'customer-success-positions-v1',editorialReview:'pending'},
 onboarding:ONBOARDING_PROGRAM,
};
export const DEFAULT_POSITION='customer_success';
export function positionProgram(key:string|null|undefined){return key&&Object.hasOwn(POSITION_PROGRAMS,key)?POSITION_PROGRAMS[key]:null;}
export const positionExamKey=(program:PositionProgram,level:number)=>program.exams.find(a=>a.level===level)!.key;
/** Totals shown on the route page, derived from the content so they never drift from it. */
export function positionProgramTotals(program:PositionProgram){
 const required=[...program.lessons,...program.exams,...program.projects];
 return {levels:program.levels.length,lessons:program.lessons.length,exercises:program.lessons.length*2,questions:program.exams.reduce((n,a)=>n+a.decisions.length,0),projects:program.projects.length,hours:required.reduce((n,a)=>n+a.hours,0)};
}
export const POSITION_ITEMS=[...CS_CURRICULUM_LESSONS,...CS_CURRICULUM_EXAMS,...CS_CURRICULUM_PROJECTS,...POSITION_DIAGNOSTICS,...CS_CURRICULUM_OPTIONAL,...ONBOARDING_PROGRAM.lessons,...ONBOARDING_PROGRAM.exams,...ONBOARDING_PROGRAM.projects];
export function positionItem(key:string){return POSITION_ITEMS.find(a=>a.key===key);}
export function positionProjectApproved(evidence:CompetencyEvidence[],key:string,org:string|null){
 const human=evidence.filter(e=>e.organization_id===org&&e.activity_key===key&&['manager','admin'].includes(e.review_source)).sort((a,b)=>Date.parse(b.observed_at)-Date.parse(a.observed_at)||b.id.localeCompare(a.id));
 const latest=human[0];return Boolean(latest&&!latest.critical_errors.length&&Object.values(latest.competency_scores).every(v=>Number(v)>=3));
}
export function positionGrade(item:PositionItem,answers:number[]){if(answers.length!==item.decisions.length||answers.some((v,i)=>!Number.isInteger(v)||v<0||v>=item.decisions[i].options.length))throw Error('INVALID_ANSWERS');return answers.map((v,i)=>v===item.decisions[i].correct?1:0);}
