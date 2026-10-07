import {ADDON_OFFERS,getOfferState,type BasePlan,type Readiness} from './modular-offers.ts';
/** Offline change intents, never Stripe API payloads. Apply only through a reviewed adapter. */
export type SubscriptionSnapshot={id:string;plan:BasePlan;baseItemId:string;items:readonly {id:string;key:string;priceId:string;quantity:number;cents:number}[]};
function validateSubscription(snapshot:SubscriptionSnapshot){
 if(!/^sub_[a-zA-Z0-9_]+$/.test(snapshot.id)||!['starter','pro'].includes(snapshot.plan)||!Array.isArray(snapshot.items)||snapshot.items.length===0)throw Error('INVALID_SUBSCRIPTION');
 const ids=new Set<string>(),keys=new Set<string>();for(const item of snapshot.items){if(!/^si_[a-zA-Z0-9_]+$/.test(item.id)||ids.has(item.id)||keys.has(item.key)||!/^price_[a-zA-Z0-9_]+$/.test(item.priceId)||!Number.isSafeInteger(item.quantity)||item.quantity<1||!Number.isSafeInteger(item.cents)||item.cents<0)throw Error('INVALID_ITEM');ids.add(item.id);keys.add(item.key);}
 if(snapshot.items.find(x=>x.id===snapshot.baseItemId)?.key!=='base')throw Error('BASE_ITEM_MISSING');
}
export function planMonthlyAddonChange(snapshot:SubscriptionSnapshot,key:string,action:'add'|'cancel',ready:Readiness){
 validateSubscription(snapshot);if(!['add','cancel'].includes(action))throw Error('INVALID_ACTION');
 const offer=ADDON_OFFERS.find(x=>x.key===key);if(!offer||offer.kind!=='monthly')throw Error('MONTHLY_ADDON_REQUIRED');
 const existing=snapshot.items.find(x=>x.key===key);const preserved=snapshot.items.filter(x=>x.key!==key);
 if(action==='cancel')return {kind:existing?'remove_addon_at_renewal':'no_change',subscriptionId:snapshot.id,itemId:existing?.id,preserved,basePlan:snapshot.plan};
 if(existing)return {kind:'keep_existing_price',subscriptionId:snapshot.id,itemId:existing.id,priceId:existing.priceId,cents:existing.cents,basePlan:snapshot.plan};
 const state=getOfferState(key,snapshot.plan,ready);
 if(state==='included')return {kind:'included_entitlement',subscriptionId:snapshot.id,key,basePlan:snapshot.plan};
 if(state!=='available')throw Error('ADDON_UNAVAILABLE');
 return {kind:'append_item_at_renewal',subscriptionId:snapshot.id,key,preserved,basePlan:snapshot.plan,invoiceFailurePolicy:'requires_review',needsResolvedPrice:true};
}
/** 50 -> 100, agreed introductory pricing for a NEW Tutor item; preserves every other item.
 * Existing schedules/intro windows require a current Stripe snapshot and separate migration review.
 */
export function newTutorIntroIntent(snapshot:SubscriptionSnapshot,prices:{first:string;renewal:string},ready:Readiness){
 validateSubscription(snapshot);
 if(getOfferState('ai_tutor',snapshot.plan,ready)!=='available'||snapshot.items.some(x=>x.key==='ai_tutor'))throw Error('NEW_TUTOR_REQUIRED');
 if(!/^price_[a-zA-Z0-9_]+$/.test(prices.first)||!/^price_[a-zA-Z0-9_]+$/.test(prices.renewal)||prices.first===prices.renewal)throw Error('PRICE_PAIR_REQUIRED');
 const preserved=snapshot.items.map(x=>({priceId:x.priceId,quantity:x.quantity}));
 return {subscriptionId:snapshot.id,phases:[{months:1,items:[...preserved,{priceId:prices.first,quantity:1}]},{months:null,items:[...preserved,{priceId:prices.renewal,quantity:1}]}],firstCents:5000,renewalCents:10000,activation:'blocked_pending_stripe_sandbox_adapter'} as const;
}
export type PaidOwnership={key:string;kind:'monthly'|'one_time';status:'paid'|'canceled'|'refunded'|'revoked'};
/** Inputs must come from validated DB/provider ownership, never Checkout query parameters. */
export function ownedLaunchAddons(plan:BasePlan,records:readonly PaidOwnership[],ready:Readiness,selectedRoute='route_customer_success'){
 if(!['free','starter','pro'].includes(plan))throw Error('INVALID_PLAN');const owned=new Set<string>();
 const keys=new Set<string>();for(const record of records){if(keys.has(record.key)||!['monthly','one_time'].includes(record.kind)||!['paid','canceled','refunded','revoked'].includes(record.status))throw Error('INVALID_OWNERSHIP_SNAPSHOT');keys.add(record.key);}
 for(const offer of ADDON_OFFERS){const state=getOfferState(offer.key,plan,ready);if(state==='coming_soon')continue;
  if(state==='included'&&(!offer.key.startsWith('route_')||offer.key===selectedRoute))owned.add(offer.key);
  if(records.some(x=>x.key===offer.key&&x.kind===offer.kind&&x.status==='paid'&&(x.kind==='one_time'||plan!=='free')))owned.add(offer.key);
 }
 return [...owned];
}
/** A joint invoice failure does not identify an individual failed item. No automatic base-plan mutation. */
export function reviewJointInvoiceFailure(subscriptionId:string){
 if(!/^sub_[a-zA-Z0-9_]+$/.test(subscriptionId))throw Error('INVALID_SUBSCRIPTION');
 return {subscriptionId,requiresReconciliation:true,basePlanMutation:null,addonToCancel:null,decision:'Determine paid coverage and an approved grace/remediation policy before changing access.'} as const;
}
