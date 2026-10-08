export type CancellationAction='scheduled'|'reversed'|'ended';
/** Observe verified provider transitions without changing subscriptions or prices. */
export function cancellationAction(type:string,cancelAtEnd:boolean,previous:unknown):CancellationAction|null{
 if(type==='customer.subscription.deleted')return 'ended';
 if(type==='customer.subscription.created')return cancelAtEnd?'scheduled':null;
 if(type!=='customer.subscription.updated'||typeof previous!=='object'||!previous||!Object.hasOwn(previous,'cancel_at_period_end'))return null;
 const was=(previous as {cancel_at_period_end:unknown}).cancel_at_period_end;
 if(was===false&&cancelAtEnd)return 'scheduled';
 if(was===true&&!cancelAtEnd)return 'reversed';return null;
}
