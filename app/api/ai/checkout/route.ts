import Stripe from 'stripe';import {randomUUID} from 'node:crypto';
import {workspaceUser} from '../../../../lib/workspace-server';import {trustedWorkspaceMutation} from '../../../../lib/workspace-sandbox';
import {createAdminSupabase} from '../../../../lib/admin';import {consumeRateLimit} from '../../../../lib/rate-limit';
import {tutorAdditionPhases,tutorCancellationPhases} from '../../../../lib/tutor-schedule';
export async function POST(req:Request){
 if(!trustedWorkspaceMutation(req))return Response.json({error:'INVALID_ORIGIN'},{status:403});
 const session=await workspaceUser();if(!session)return Response.json({error:'UNAUTHENTICATED'},{status:401});
 if(!process.env.STRIPE_SECRET_KEY)return Response.json({error:'AI_TUTOR_NOT_CONFIGURED'},{status:503});
 let body;try{body=await req.json();}catch{return Response.json({error:'PAYMENT_AUTHORIZATION_REQUIRED'},{status:400});}
 if(body?.action==='add'&&!process.env.OPENAI_API_KEY)return Response.json({error:'AI_TUTOR_NOT_CONFIGURED'},{status:503});
 if(body?.paymentAuthorization!==true||!['add','cancel'].includes(body.action))return Response.json({error:'PAYMENT_AUTHORIZATION_REQUIRED'},{status:400});
 const rate=await consumeRateLimit('ai-addon:'+session.user.id,3,600);if(!rate.allowed)return Response.json({error:'RATE_LIMITED'},{status:429});
 const admin=createAdminSupabase();
 const {data:profile,error}=await admin.from('profiles').select('plan_name,status,stripe_subscription_id,stripe_customer_id').eq('id',session.user.id).single();
 if(error||profile?.status!=='active')return Response.json({error:'ACCOUNT_INACTIVE'},{status:403});
 if(profile.plan_name==='pro')return Response.json({included:true});
 if(profile.plan_name!=='starter'||!profile.stripe_subscription_id||!profile.stripe_customer_id)return Response.json({error:'PAID_BASE_PLAN_REQUIRED'},{status:409});
 const {data:offer}=await admin.from('addons').select('status').eq('key','ai_tutor').maybeSingle();
 if(body.action==='add'&&offer?.status!=='active')return Response.json({error:'ADDON_UNAVAILABLE'},{status:503});
 const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);
 const first=process.env.STRIPE_AI_TUTOR_MONTH1_PRICE_ID,renewal=process.env.STRIPE_AI_TUTOR_MONTH3PLUS_PRICE_ID;
 if(!first||!renewal)return Response.json({error:'PRICES_UNAVAILABLE'},{status:503});
 const sub=await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
 if(sub.status!=='active'||(typeof sub.customer==='string'?sub.customer:sub.customer.id)!==profile.stripe_customer_id)return Response.json({error:'BASE_SUBSCRIPTION_UNAVAILABLE'},{status:409});
 const baseIds=new Set([process.env.STRIPE_STARTER_PRICE_ID,process.env.STRIPE_PRO_PRICE_ID].filter(Boolean));
 if(!sub.items.data.some(x=>baseIds.has(x.price.id)))return Response.json({error:'BASE_SUBSCRIPTION_UNAVAILABLE'},{status:409});
 const prices=await Promise.all([stripe.prices.retrieve(first),stripe.prices.retrieve(renewal)]);
 if(prices.some((p,i)=>!p.active||p.currency!=='mxn'||p.unit_amount!==[5000,10000][i]||p.recurring?.interval!=='month'||p.recurring.interval_count!==1))return Response.json({error:'PRICES_UNAVAILABLE'},{status:503});
 const items=sub.items.data.map(x=>({price:x.price.id,quantity:x.quantity??1}));
 const tutorPrices=new Set([first,renewal,process.env.STRIPE_AI_TUTOR_MONTH2_PRICE_ID].filter(Boolean) as string[]);
 const currentTutor=sub.items.data.find(x=>tutorPrices.has(x.price.id));
 if(body.action==='add'&&(currentTutor||sub.schedule))return Response.json({error:'SUBSCRIPTION_ALREADY_SCHEDULED'},{status:409});
 
 // A cancellation merges only schedules created by this adapter, never a customer's unrelated schedule.
 let existingSchedule:Stripe.SubscriptionSchedule|null=null;
 if(sub.schedule){existingSchedule=await stripe.subscriptionSchedules.retrieve(typeof sub.schedule==='string'?sub.schedule:sub.schedule.id);if(existingSchedule.metadata?.codezero_modular!=='tutor-v2')return Response.json({error:'SCHEDULE_REQUIRES_REVIEW'},{status:409});}
 const futureTutor=existingSchedule?.phases.some(p=>p.items.some(x=>tutorPrices.has(typeof x.price==='string'?x.price:x.price.id)));
 if(body.action==='cancel'&&!currentTutor&&!futureTutor)return Response.json({error:'TUTOR_ITEM_NOT_FOUND'},{status:409});
 const otherItems=items.filter(x=>!tutorPrices.has(x.price)).map(x=>x.price+':'+x.quantity).sort().join(',');
 if(existingSchedule?.phases.some(p=>p.items.filter(x=>!tutorPrices.has(typeof x.price==='string'?x.price:x.price.id)).map(x=>(typeof x.price==='string'?x.price:x.price.id)+':'+(x.quantity??1)).sort().join(',')!==otherItems))return Response.json({error:'SCHEDULE_REQUIRES_REVIEW'},{status:409});
 const operationId=randomUUID();
 const claimed=await admin.rpc('claim_addon_billing_operation',{p_id:operationId,p_user:session.user.id,p_subscription:sub.id,p_action:body.action});
 if(claimed.error||claimed.data!==true)return Response.json({error:'BILLING_OPERATION_PENDING'},{status:409});
 try{
  const schedule=existingSchedule??await stripe.subscriptionSchedules.create({from_subscription:sub.id},{idempotencyKey:'codezero-schedule-'+operationId});
  if(!schedule.current_phase)throw Error('CURRENT_PHASE_UNAVAILABLE');
  const range={start:schedule.current_phase.start_date,end:schedule.current_phase.end_date,items,tutorPrices};
  const phases=body.action==='add'?tutorAdditionPhases({...range,first,renewal}):currentTutor?tutorCancellationPhases(range):[{start_date:range.start,end_date:range.end,items,proration_behavior:'none' as const},{items,proration_behavior:'none' as const}];
  const updated=await stripe.subscriptionSchedules.update(schedule.id,{end_behavior:'release',proration_behavior:'none',phases,metadata:{...schedule.metadata,codezero_modular:'tutor-v2'}},{idempotencyKey:'codezero-phases-'+operationId});
  const {error:writeError}=await admin.from('account_addons').upsert({user_id:session.user.id,addon_key:'ai_tutor',catalog_key:'ai_tutor',status:currentTutor?'active':body.action==='cancel'?'canceled':'incomplete',stripe_customer_id:profile.stripe_customer_id,stripe_subscription_id:sub.id,stripe_subscription_item_id:currentTutor?.id??null,stripe_schedule_id:updated.id,current_price_id:currentTutor?.price.id??first,cancel_at_period_end:body.action==='cancel',updated_at:new Date().toISOString()},{onConflict:'user_id,addon_key'});
  if(writeError)throw writeError;
  const saved=await admin.from('addon_billing_operations').update({status:'confirmed',schedule_id:updated.id,updated_at:new Date().toISOString()}).eq('id',operationId).eq('user_id',session.user.id);if(saved.error)throw saved.error;
  return Response.json({scheduled:true,effectiveAt:new Date(range.end*1000).toISOString()});
 }catch{
  await admin.from('addon_billing_operations').update({status:'uncertain',updated_at:new Date().toISOString()}).eq('id',operationId).eq('user_id',session.user.id);
  return Response.json({error:'BILLING_RECONCILIATION_REQUIRED'},{status:503});
 }
}
