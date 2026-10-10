export const ADVANCED_ASSESSMENT_VERSION = "cs-decision-evidence-v2.0" as const;
export const ADVANCED_ACTIVITY_KEY = "cs-decision-evidence-v2";
export const ADVANCED_COMPETENCIES = ["diagnosis","data","planning"] as const;
export type AdvancedCompetency = (typeof ADVANCED_COMPETENCIES)[number];
export const ADVANCED_STAGES=[1,3,5,7,9,11,13,15] as const;
export type AdvancedMetrics={trust:number;adoption:number;risk:number;budget:number;days:number};
export type AdvancedInput={choice:string;facts:string;tradeoff:string;verification:string};
export type AdvancedEvent=AdvancedInput&{scene:string;stage:number;rating:number;critical:boolean;tradeoffCategory:string;metrics:AdvancedMetrics};
export type AdvancedState={step:number;metrics:AdvancedMetrics;events:AdvancedEvent[]};
type Option={id:string;base:0|1|2|3|4;delta:Partial<AdvancedMetrics>;skill:AdvancedCompetency;cost?:number;critical?:boolean};
const SCENES:Record<string,readonly Option[]>={
 intake:[
  {id:"triage",base:4,delta:{trust:5,risk:-7,days:-4,budget:-800},skill:"diagnosis"},
  {id:"exec",base:3,delta:{trust:11,risk:-3,days:-8,budget:-1500},skill:"planning"},
  {id:"quickfix",base:2,delta:{adoption:4,risk:8,days:-5,budget:-1100},skill:"planning"},
  {id:"freeze",base:1,delta:{trust:-8,risk:11,days:-2},skill:"diagnosis"}],
 diagnosis:[
  {id:"cohort",base:4,delta:{risk:-12,trust:7,budget:-1100,days:-5},skill:"data"},
  {id:"interview",base:3,delta:{trust:12,risk:-5,budget:-700,days:-6},skill:"diagnosis"},
  {id:"report",base:2,delta:{risk:6,trust:2,budget:-200,days:-4},skill:"data"},
  {id:"permissions",base:2,delta:{adoption:6,risk:8,trust:-4,budget:-900,days:-5},skill:"diagnosis"}],
 stakeholders:[
  {id:"charter",base:4,delta:{trust:10,risk:-8,days:-6,budget:-1300},skill:"planning"},
  {id:"sponsor",base:3,delta:{trust:13,risk:-3,days:-7,budget:-500},skill:"planning"},
  {id:"procurement",base:2,delta:{trust:3,risk:5,days:-6,budget:-900},skill:"diagnosis"},
  {id:"delegate",base:1,delta:{trust:-8,risk:11,days:-7},skill:"planning"}],
 tradeoff:[
  {id:"scoped",base:4,delta:{adoption:10,trust:6,risk:-8,budget:-1800,days:-7},skill:"planning"},
  {id:"pilot",base:3,delta:{adoption:6,trust:8,risk:-4,budget:-800,days:-9},skill:"planning"},
  {id:"build",base:2,delta:{adoption:12,risk:15,budget:-4800,trust:-5,days:-13},skill:"planning"},
  {id:"promise",base:0,delta:{trust:-20,risk:25,days:-7},skill:"planning",critical:true}],
 finance:[
  {id:"value",base:4,delta:{trust:7,risk:-10,days:-5,budget:-450},skill:"data"},
  {id:"commercial",base:3,delta:{trust:10,risk:-4,days:-6,budget:-700},skill:"planning"},
  {id:"flat",base:2,delta:{trust:2,risk:8,days:-4,budget:-2200},skill:"data"},
  {id:"invent",base:0,delta:{trust:-25,risk:24,days:-2},skill:"data",critical:true}],
 crisis:[
  {id:"recovery",base:4,delta:{trust:10,risk:-12,budget:-1200,days:-5},skill:"planning"},
  {id:"breach",base:3,delta:{trust:9,risk:-8,budget:-2000,days:-4},skill:"diagnosis"},
  {id:"discount",base:2,delta:{trust:4,risk:7,budget:-1300,days:-6},skill:"planning"},
  {id:"conceal",base:0,delta:{trust:-25,risk:22,days:-2},skill:"data",critical:true}],
 evidence:[
  {id:"reconcile",base:4,delta:{trust:9,risk:-10,adoption:5,budget:-800,days:-5},skill:"data"},
  {id:"sample",base:3,delta:{trust:7,risk:-5,adoption:3,budget:-300,days:-4},skill:"data"},
  {id:"aggregate",base:2,delta:{trust:2,risk:6,adoption:6,days:-4},skill:"data"},
  {id:"omit",base:0,delta:{trust:-24,risk:23,days:-2},skill:"data",critical:true}],
 renewal:[
  {id:"conditional",base:4,delta:{trust:8,risk:-9,adoption:6,budget:-650,days:-5},skill:"planning"},
  {id:"short",base:3,delta:{trust:10,risk:-5,days:-5,budget:-450},skill:"planning"},
  {id:"rebate",base:2,delta:{trust:3,risk:5,budget:-2200,days:-6},skill:"planning"},
  {id:"pressure",base:1,delta:{trust:-10,risk:10,days:-5},skill:"planning"}],
 transfer:[
  {id:"disclose",base:4,delta:{trust:8,risk:-13,adoption:-4,days:-3},skill:"data"},
  {id:"audit",base:3,delta:{trust:5,risk:-7,budget:-1500,days:-6},skill:"diagnosis"},
  {id:"internal",base:2,delta:{trust:-3,risk:5,days:-4},skill:"planning"},
  {id:"suppress",base:0,delta:{trust:-25,risk:25,days:-2},skill:"data",critical:true}]
};
const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
export function startAdvanced():AdvancedState{return {step:0,metrics:{trust:44,adoption:42,risk:68,budget:12000,days:45},events:[]};}
export function sceneFor(s:AdvancedState){
 return ["intake","diagnosis","stakeholders","tradeoff","finance",s.metrics.risk>70||s.metrics.trust<45?"crisis":"evidence","renewal","transfer"][s.step]??"finished";
}
export function advancedOptions(s:AdvancedState):readonly Option[]{return SCENES[sceneFor(s)]??[];}
export function applyAdvancedDecision(s:AdvancedState,input:AdvancedInput):AdvancedState{
 if(s.step>=ADVANCED_STAGES.length)throw Error("COMPLETED");
 if(s.events.length!==s.step)throw Error("INVALID_STATE");
 for(const key of ["facts","tradeoff","verification"] as const){
  const v=input[key];
  if(typeof v!=="string"||v.trim().length<50||v.length>1800)throw Error("JUSTIFICATION_INCOMPLETE");
 }
 const opt=advancedOptions(s).find(a=>a.id===input.choice);
 if(!opt)throw Error("INVALID_OPTION");
 const quality=clamp(opt.base+(s.metrics.budget<2000&&((opt.delta.budget??0)<-1000)?-1:0)+(s.metrics.days<12&&opt.id==="pilot"?-1:0),0,4);
 const metrics={
  trust:clamp(s.metrics.trust+(opt.delta.trust??0),0,100),
  adoption:clamp(s.metrics.adoption+(opt.delta.adoption??0),0,100),
  risk:clamp(s.metrics.risk+(opt.delta.risk??0),0,100),
  budget:clamp(s.metrics.budget+(opt.delta.budget??0),0,12000),
  days:clamp(s.metrics.days+(opt.delta.days??0),0,45),
 };
 const event:AdvancedEvent={...input,facts:input.facts.trim(),tradeoff:input.tradeoff.trim(),verification:input.verification.trim(),scene:sceneFor(s),stage:ADVANCED_STAGES[s.step],rating:quality,critical:!!opt.critical,tradeoffCategory:opt.skill,metrics};
 return {step:s.step+1,metrics,events:[...s.events,event]};
}
export function replayAdvancedPartial(inputs:AdvancedInput[]):AdvancedState{
 if(!Array.isArray(inputs)||inputs.length>ADVANCED_STAGES.length)throw Error("INVALID_SEQUENCE");
 return inputs.reduce(applyAdvancedDecision,startAdvanced());
}
export function replayAdvanced(inputs:AdvancedInput[]):AdvancedState{
 if(!Array.isArray(inputs)||inputs.length!==ADVANCED_STAGES.length)throw Error("UNFINISHED");
 return replayAdvancedPartial(inputs);
}
export function advancedSummary(s:AdvancedState){
 if(s.step!==ADVANCED_STAGES.length)throw Error("UNFINISHED");
 const critical=s.events.filter(e=>e.critical).length;
 const total=s.events.reduce((acc,e)=>acc+e.rating*(e.stage+2),0);
 const possible=s.events.reduce((acc,e)=>acc+4*(e.stage+2),0);
 const objective=Math.round(total/possible*100);
 const signals=Object.fromEntries(ADVANCED_COMPETENCIES.map(key=>{
  const rows=s.events.filter(e=>e.tradeoffCategory===key);
  return [key,{count:rows.length,indicative:rows.length>=2?Math.round(rows.reduce((a,b)=>a+b.rating,0)/rows.length*10)/10:null}];
 }));
 const limitations=["La opción elegida puede verificarse, pero la calidad de las justificaciones no se califica automáticamente.", "El perfil no es una certificación y requiere revisión humana."];
 return {objective,critical,metrics:s.metrics,signals,limitations,readyForHumanReview:critical===0&&objective>=70};
}
export function recommendAdvanced(s:AdvancedState){
 const report=advancedSummary(s);
 const ranked=ADVANCED_COMPETENCIES.map(key=>({key,provisional:report.signals[key].indicative,observations:report.signals[key].count})).sort((a,b)=>(a.provisional??-1)-(b.provisional??-1));
 return ranked.filter(x=>x.observations>0).slice(0,2).map(x=>x.key);
}
