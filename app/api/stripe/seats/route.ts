import Stripe from 'stripe';
import {createHash} from 'node:crypto';
import {NextResponse} from 'next/server';
import {createAdminSupabase} from '../../../../lib/admin';
import {getServerUser,createServerSupabase} from '../../../../lib/supabase-server';
import {trustedWorkspaceMutation,isUuid} from '../../../../lib/workspace-sandbox';
import {boundedForm} from '../../../../lib/bounded-form';
import {consumeRateLimit} from '../../../../lib/rate-limit';
import {validSeatQuantity,validSeatPrice} from '../../../../lib/seat-policy';
import {BASE_PRICES} from '../../../../lib/modular-offers';
import {syncSeatSubscription} from '../../../../lib/seat-billing';
export async function POST(req:Request){
 if(!trustedWorkspaceMutation(req,process.env.NEXT_PUBLIC_APP_URL))return NextResponse.json({error:'FORBIDDEN'},{status:403});
 const {data:{user}}=await getServerUser();if(!user)return NextResponse.json({error:'UNAUTHENTICATED'},{status:401});
 if(!user.email_confirmed_at)return NextResponse.json({error:'EMAIL_UNVERIFIED'},{status:403});
 const supabase=await createServerSupabase(),{data:profile}=await supabase.from('profiles').select('role,status,stripe_customer_id,stripe_subscription_id').eq('id',user.id).single();
 if(!profile||profile.status!=='active')return NextResponse.json({error:'FORBIDDEN'},{status:403});if(profile.role==='owner')return NextResponse.json({error:'OWNER_PRIVATE'},{status:403});
 const rate=await consumeRateLimit('seat-checkout:'+user.id,5,600);if(!rate.allowed)return NextResponse.json({error:'RATE_LIMITED'},{status:429});
 let form:FormData;try{form=await boundedForm(req,4096);}catch{return NextResponse.json({error:'INVALID_REQUEST'},{status:400});}
 const seats=Number(form.get('seats')),plan=String(form.get('plan')),name=String(form.get('company_name')??'').trim(),request=String(form.get('request_id'));
 if(!isUuid(request)||!validSeatQuantity(seats)||!['starter','pro'].includes(plan)||name.length<2||name.length>120||form.get('payment_authorization')!=='1'||form.get('permissions_acknowledged')!=='1')return NextResponse.json({error:'INVALID_REQUEST'},{status:400});
 const priceId=plan==='starter'?process.env.STRIPE_STARTER_PRICE_ID:process.env.STRIPE_PRO_PRICE_ID;
 if(!priceId||!process.env.STRIPE_SECRET_KEY)return NextResponse.json({error:'STRIPE_NOT_CONFIGURED'},{status:503});
 const stripe=new Stripe(process.env.STRIPE_SECRET_KEY),admin=createAdminSupabase(),base=process.env.NEXT_PUBLIC_APP_URL!;
 try{
  const price=await stripe.prices.retrieve(priceId);if(!price.active||!validSeatPrice(price,BASE_PRICES[plan as 'starter'|'pro']))return NextResponse.json({error:'PRICE_MISMATCH'},{status:503});
  let orderId=request;
  if(profile.stripe_subscription_id){
   const subscription=await stripe.subscriptions.retrieve(profile.stripe_subscription_id,{expand:['latest_invoice']});
   const customer=typeof subscription.customer==='string'?subscription.customer:subscription.customer.id;
   if(customer!==profile.stripe_customer_id||!['active','trialing'].includes(subscription.status))return NextResponse.json({error:'INVALID_SUBSCRIPTION'},{status:409});
   if(subscription.pending_update||(typeof subscription.latest_invoice==='object'&&subscription.latest_invoice?.status==='open'))return NextResponse.json({error:'PENDING_PAYMENT'},{status:409});
   const item=subscription.items.data.find(i=>[process.env.STRIPE_STARTER_PRICE_ID,process.env.STRIPE_PRO_PRICE_ID].includes(i.price.id));if(!item)return NextResponse.json({error:'INVALID_SUBSCRIPTION'},{status:409});
   if(seats<(item.quantity??1))return NextResponse.json({error:'SEATS_BELOW_USAGE'},{status:409});
   const lookup=await admin.from('company_seat_orders').select('id,requester_id,organization_id').eq('stripe_subscription_id',subscription.id).maybeSingle();if(lookup.error)throw lookup.error;
   if(lookup.data){if(lookup.data.requester_id!==user.id)return NextResponse.json({error:'FORBIDDEN'},{status:403});orderId=lookup.data.id;if(lookup.data.organization_id){const used=await admin.rpc('company_seat_usage',{p_org:lookup.data.organization_id});if(used.error)throw used.error;if(Number(used.data)>seats)return NextResponse.json({error:'SEATS_BELOW_USAGE'},{status:409});}}
   else{const insert=await admin.from('company_seat_orders').insert({id:orderId,requester_id:user.id,company_name:name,plan_name:plan,requested_seats:seats,stripe_subscription_id:subscription.id,stripe_customer_id:customer});if(insert.error)throw insert.error;}
   const saved=await admin.from('company_seat_orders').update({plan_name:plan,requested_seats:seats,updated_at:new Date().toISOString()}).eq('id',orderId).eq('requester_id',user.id);if(saved.error)throw saved.error;
   await stripe.subscriptions.update(subscription.id,{metadata:{garciloga_seat_order:orderId}},{idempotencyKey:'garciloga-seat-metadata-'+request});
   const changed=await stripe.subscriptions.update(subscription.id,{items:[{id:item.id,price:priceId,quantity:seats}],payment_behavior:'pending_if_incomplete',proration_behavior:'always_invoice',expand:['latest_invoice']},{idempotencyKey:'garciloga-seat-update-'+request});
   await syncSeatSubscription(stripe,changed);
   const invoice=typeof changed.latest_invoice==='object'?changed.latest_invoice:null;
   return NextResponse.json({url:invoice?.status==='open'?invoice.hosted_invoice_url:base+'/teams?seats=processing'});
  }
  const previous=await admin.from('company_seat_orders').select('id,requester_id,requested_seats,plan_name,company_name').eq('id',request).maybeSingle();if(previous.error)throw previous.error;
  if(previous.data){if(previous.data.requester_id!==user.id||previous.data.requested_seats!==seats||previous.data.plan_name!==plan||previous.data.company_name!==name)return NextResponse.json({error:'INVALID_REQUEST'},{status:409});}
  else{const insert=await admin.from('company_seat_orders').insert({id:request,requester_id:user.id,company_name:name,plan_name:plan,requested_seats:seats,stripe_customer_id:profile.stripe_customer_id});if(insert.error)throw insert.error;}
  const metadata={user_id:user.id,plan_name:plan,garciloga_seat_order:request,payment_authorization_confirmed:'true',permissions_acknowledged:'true'};
  const suffix=Array.from(createHash('sha256').update(request).digest().subarray(0,8),n=>String.fromCharCode(97+n%26)).join('');
  const checkout=await stripe.checkout.sessions.create({integration_identifier:'garciloga-seats-'+suffix,mode:'subscription',line_items:[{price:priceId,quantity:seats}],...(profile.stripe_customer_id?{customer:profile.stripe_customer_id}:{customer_email:user.email}),client_reference_id:user.id,metadata,subscription_data:{metadata},success_url:base+'/teams?seats=processing',cancel_url:base+'/teams/seats?checkout=cancelled'},{idempotencyKey:'garciloga-seat-checkout-'+request});
  return NextResponse.json({url:checkout.url});
 }catch{return NextResponse.json({error:'SEAT_CHECKOUT_FAILED'},{status:409});}
}
