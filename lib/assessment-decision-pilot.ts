export const PILOT_MODEL_VERSION = "customer-success-decisions-0.1" as const;
export const PILOT_STAGES = [2,5,8,11,14] as const;
export type PilotSkill = "communication" | "diagnosis" | "data" | "planning" | "negotiation";
export type PilotMetrics = { adoption: number; trust: number; risk: number; days: number };
export type PilotOption = {
  id: string;
  quality: 0 | 1 | 2 | 3 | 4;
  scores: Partial<Record<PilotSkill, number>>;
  delta: Partial<PilotMetrics>;
  critical?: boolean;
};
export type PilotEvent = {
  stage: number;
  scenario: string;
  choice: string;
  rationale: string;
  quality: number;
  weight: number;
  critical: boolean;
};
export type PilotState = {
  stage: number;
  metrics: PilotMetrics;
  events: PilotEvent[];
  criticalErrors: number;
  weightedEarned: number;
  weightedAvailable: number;
  observations: Partial<Record<PilotSkill, { total: number; weight: number; count: number }>>;
};
const OPTIONS: Record<string, PilotOption[]> = {
  diagnosis: [
    {id:"discover",quality:4,scores:{diagnosis:4,data:4},delta:{risk:-10,trust:12}},
    {id:"discount",quality:1,scores:{diagnosis:1,negotiation:1},delta:{risk:15,trust:-12}},
    {id:"wait",quality:0,scores:{diagnosis:0,planning:0},delta:{risk:20,trust:-18}},
  ],
  communication: [
    {id:"frame",quality:4,scores:{communication:4,planning:3},delta:{risk:-5,trust:12,days:-3}},
    {id:"promise",quality:0,scores:{communication:0,planning:0},delta:{risk:20,trust:-24},critical:true},
    {id:"silent",quality:0,scores:{communication:0,planning:0},delta:{risk:12,trust:-15}},
  ],
  escalation: [
    {id:"recover",quality:4,scores:{negotiation:3,communication:4,diagnosis:3},delta:{risk:-12,trust:14,days:-4}},
    {id:"concession",quality:1,scores:{negotiation:1,planning:1},delta:{risk:6,trust:-5}},
    {id:"conceal",quality:0,scores:{communication:0,data:0},delta:{risk:20,trust:-20},critical:true},
  ],
  evidence: [
    {id:"verify",quality:4,scores:{data:4,negotiation:3,diagnosis:4},delta:{adoption:8,risk:-12,trust:10,days:-4}},
    {id:"vanity",quality:0,scores:{data:0,communication:0},delta:{risk:15,trust:-12},critical:true},
    {id:"defer",quality:1,scores:{data:1,planning:1},delta:{risk:8,trust:-7}},
  ],
  planning: [
    {id:"phased",quality:4,scores:{planning:4,data:3},delta:{adoption:14,risk:-12,trust:8,days:-7}},
    {id:"shortcut",quality:0,scores:{planning:0,diagnosis:0},delta:{risk:18,trust:-12,days:-8},critical:true},
    {id:"freeze",quality:1,scores:{planning:1,negotiation:1},delta:{risk:9,trust:-5,days:-6}},
  ],
  transfer: [
    {id:"revise",quality:4,scores:{diagnosis:4,communication:4,planning:4},delta:{risk:-12,trust:10}},
    {id:"cherry",quality:0,scores:{data:0,communication:0},delta:{risk:20,trust:-20},critical:true},
    {id:"ignore",quality:1,scores:{diagnosis:1,planning:1},delta:{risk:10,trust:-8}},
  ],
};
export const PILOT_SKILLS: PilotSkill[] = ["diagnosis","data","communication","planning","negotiation"];
export function initialPilot(): PilotState {
  return {stage:0,metrics:{adoption:42,trust:45,risk:60,days:45},events:[],criticalErrors:0,weightedEarned:0,weightedAvailable:0,observations:{}};
}
export function pilotScene(state: PilotState): string {
  switch(state.stage){
    case 0:return "diagnosis";
    case 1:return "communication";
    case 2:return state.metrics.risk >= 65 || state.metrics.trust <= 34 ? "escalation" : "evidence";
    case 3:return "planning";
    case 4:return "transfer";
    default:return "complete";
  }
}
export function pilotOptions(state: PilotState): readonly PilotOption[] {
  return OPTIONS[pilotScene(state)] ?? [];
}
const limit=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export function decidePilot(state:PilotState,choiceId:string,rationale:string):PilotState {
  if(state.stage>=PILOT_STAGES.length)throw new Error("COMPLETE");
  if(rationale.trim().length<40||rationale.length>2500)throw new Error("RATIONALE_REQUIRED");
  const scene=pilotScene(state),choice=pilotOptions(state).find(o=>o.id===choiceId);
  if(!choice)throw new Error("INVALID_CHOICE");
  const weight=state.stage+1;
  const observations: PilotState["observations"] = {...state.observations};
  for(const [skill,score] of Object.entries(choice.scores) as [PilotSkill,number][]){
    const prev=observations[skill]??{total:0,weight:0,count:0};
    observations[skill]={total:prev.total+score*weight,weight:prev.weight+weight,count:prev.count+1};
  }
  const metric=(key:keyof PilotMetrics,min:number,max:number)=>limit(state.metrics[key]+(choice.delta[key]??0),min,max);
  return {
    stage:state.stage+1,
    metrics:{adoption:metric("adoption",0,100),trust:metric("trust",0,100),risk:metric("risk",0,100),days:metric("days",0,90)},
    events:[...state.events,{stage:state.stage,scenario:scene,choice:choice.id,rationale:rationale.trim(),quality:choice.quality,weight,critical:choice.critical===true}],
    criticalErrors:state.criticalErrors+Number(choice.critical===true),
    weightedEarned:state.weightedEarned+choice.quality*weight,
    weightedAvailable:state.weightedAvailable+4*weight,
    observations,
  };
}
export function summarizePilot(state:PilotState){
  if(state.stage!==PILOT_STAGES.length)throw new Error("INCOMPLETE");
  const percentage=Math.round(state.weightedEarned/state.weightedAvailable*100);
  const skills=PILOT_SKILLS.map(key=>{const e=state.observations[key];return {
    key,observations:e?.count??0,
    // A 5-decision simulation is only exploratory: it never grants a certified level.
    indicative:e&&e.count>=2?Math.round((e.total/e.weight)*10)/10:null
  };});
  const assessed=skills.filter(x=>x.indicative!==null).sort((a,b)=>(a.indicative??0)-(b.indicative??0));
  return {percentage,criticalErrors:state.criticalErrors,skills,focus:assessed.slice(0,2).map(x=>x.key),
    decisionReady:state.criticalErrors===0&&percentage>=80};
}
