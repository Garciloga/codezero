import {extractTutorAnswer,type buildTutorDraft} from './tutor-context.ts';
/** Candidate server orchestration, deliberately unmounted from routes.
 * Every store operation must be atomic and bound to a verified account + billing period.
 * Never implement these operations as browser state or read-then-write DB requests.
 */
export type AtomicTutorStore={
 reserve(id:string,bound:number):Promise<'reserved'|'replay'>;
 claim(id:string):Promise<boolean>;
 settle(id:string,actual:number):Promise<void>;
 /** Conditional dispatched -> uncertain; preserve an already settled reservation. */
 uncertain(id:string):Promise<void>;
};
export type TutorProviderFixture={complete(draft:ReturnType<typeof buildTutorDraft>,signal:AbortSignal):Promise<{response:unknown;actualMicroUsd?:number}>};
export async function runControlledTutor(store:AtomicTutorStore,provider:TutorProviderFixture,input:{id:string;boundMicroUsd:number;providerReady:boolean;draft:ReturnType<typeof buildTutorDraft>;timeoutMs?:number}){
 if(!input.providerReady)return {status:'unavailable',answer:null} as const;
 const timeoutMs=input.timeoutMs??15000;if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)throw Error('INVALID_TIMEOUT');
 if(await store.reserve(input.id,input.boundMicroUsd)==='replay')return {status:'pending_or_previously_processed',answer:null} as const;
 if(!await store.claim(input.id))return {status:'pending_or_previously_processed',answer:null} as const;
 const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;let timedOut=false;
 const task=Promise.resolve().then(()=>provider.complete(input.draft,controller.signal));
 // Late provider completion is reconciled without sending a second answer or redispatching.
 task.then(async result=>{if(timedOut&&Number.isSafeInteger(result.actualMicroUsd)&&result.actualMicroUsd!>=0)await store.settle(input.id,result.actualMicroUsd!);}).catch(()=>{});
 try{
  const result=await Promise.race([task,new Promise<never>((_,reject)=>{timer=setTimeout(()=>{timedOut=true;controller.abort();reject(Error('PROVIDER_TIMEOUT'));},timeoutMs);})]);
  if(!Number.isSafeInteger(result.actualMicroUsd)||result.actualMicroUsd!<0){await store.uncertain(input.id);return {status:'usage_pending_reconciliation',answer:null} as const;}
  await store.settle(input.id,result.actualMicroUsd!);
  return extractTutorAnswer(result.response);
 }catch{
  await store.uncertain(input.id);return {status:'usage_pending_reconciliation',answer:null} as const;
 }finally{if(timer)clearTimeout(timer);}
}
