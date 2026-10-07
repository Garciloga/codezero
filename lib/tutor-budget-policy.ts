/** Offline candidate state machine. A real store MUST serialize reservation/settlement atomically.
 * This module never reads or writes production quotas and never calls an AI provider.
 * Monetary units are integer millionths of USD, not MXN or Stripe invoice amounts.
 */
export type TutorReservation={id:string;bound:number;state:'reserved'|'dispatched'|'uncertain'|'settled'|'released';actual?:number};
export type TutorBudget={account:string;period:string;queryLimit:number;budget:number;entries:readonly TutorReservation[]};
const int=(value:number)=>Number.isSafeInteger(value)&&value>=0;
function validate(ledger:TutorBudget){
 if(!/^[a-zA-Z0-9_-]{1,100}$/.test(ledger.account)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(ledger.period)||!int(ledger.queryLimit)||ledger.queryLimit>1000||!int(ledger.budget)||ledger.budget>1e9||!Array.isArray(ledger.entries)||ledger.entries.length>10000)throw Error('INVALID_BUDGET');
 const ids=new Set<string>();for(const x of ledger.entries){if(!/^[a-zA-Z0-9_-]{8,100}$/.test(x.id)||ids.has(x.id)||!int(x.bound)||x.bound===0||x.bound>1e9||!['reserved','dispatched','uncertain','settled','released'].includes(x.state)||(x.state==='settled'?(!int(x.actual!)||x.actual===undefined||x.actual>1e9):x.actual!==undefined))throw Error('INVALID_RESERVATION');ids.add(x.id);}
}
export function tutorBudgetUsage(ledger:TutorBudget){validate(ledger);return ledger.entries.reduce((sum,x)=>({queries:sum.queries+Number(x.state!=='released'),committed:sum.committed+(x.state==='released'?0:x.state==='settled'?x.actual!:x.bound),uncertain:sum.uncertain+Number(x.state==='uncertain')}),{queries:0,committed:0,uncertain:0});}
export function reserveTutor(ledger:TutorBudget,id:string,bound:number,providerReady:boolean){
 validate(ledger);if(!/^[a-zA-Z0-9_-]{8,100}$/.test(id)||!int(bound)||bound===0||bound>ledger.budget)throw Error('INVALID_RESERVATION');
 const existing=ledger.entries.find(x=>x.id===id);
 if(existing){if(existing.bound!==bound)throw Error('IDEMPOTENCY_MISMATCH');return {ledger,replay:true,dispatchAllowed:false};}
 if(!providerReady)throw Error('PROVIDER_UNAVAILABLE');const usage=tutorBudgetUsage(ledger);
 if(usage.uncertain>0)throw Error('RECONCILIATION_REQUIRED');
 if(usage.queries>=ledger.queryLimit)throw Error('QUERY_LIMIT');if(usage.committed+bound>ledger.budget)throw Error('COST_LIMIT');
 return {ledger:{...ledger,entries:[...ledger.entries,{id,bound,state:'reserved' as const}]},replay:false,dispatchAllowed:true};
}
export function transitionTutor(ledger:TutorBudget,id:string,next:'dispatched'|'uncertain'|'released'|'settled',actual?:number):TutorBudget{
 validate(ledger);const entry=ledger.entries.find(x=>x.id===id);if(!entry)throw Error('RESERVATION_NOT_FOUND');
 if(next==='settled'){if(!int(actual!)||actual===undefined||actual>1e9)throw Error('INVALID_USAGE');}else if(actual!==undefined)throw Error('UNEXPECTED_USAGE');
 if(entry.state===next){if(next==='settled'&&entry.actual!==actual)throw Error('SETTLEMENT_CONFLICT');return ledger;}
 const allowed={reserved:['dispatched','released'],dispatched:['uncertain','settled'],uncertain:['settled'],settled:[],released:[]} as const;
 if(!(allowed[entry.state] as readonly string[]).includes(next))throw Error('INVALID_TRANSITION');
 return {...ledger,entries:ledger.entries.map(x=>x.id===id?{id:x.id,bound:x.bound,state:next,...(next==='settled'?{actual}: {})}:x)};
}
