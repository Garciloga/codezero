import 'server-only';
import Stripe from 'stripe';
import {createAdminSupabase} from './admin';
import {BASE_PRICES} from './modular-offers';
import {validSeatPrice,validSeatQuantity} from './seat-policy';
export async function syncSeatSubscription(stripe:Stripe,subscription:Stripe.Subscription,deleted=false){
 const admin=createAdminSupabase();
 let {data:order,error}=await admin.from('company_seat_orders').select('id,organization_id,stripe_subscription_id,stripe_customer_id').eq('stripe_subscription_id',subscription.id).maybeSingle();if(error)throw error;
 if(!order&&subscription.metadata?.garciloga_seat_order){
  const lookup=await admin.from('company_seat_orders').select('id,organization_id,stripe_subscription_id,stripe_customer_id').eq('id',subscription.metadata.garciloga_seat_order).maybeSingle();if(lookup.error)throw lookup.error;order=lookup.data;
 }
 if(!order)return false;
 const customer=typeof subscription.customer==='string'?subscription.customer:subscription.customer.id;
 if(order.stripe_subscription_id&&order.stripe_subscription_id!==subscription.id||order.stripe_customer_id&&order.stripe_customer_id!==customer)throw Error('SEAT_OWNER_MISMATCH');
 // Preserve already paid capacity while Stripe awaits a quantity-change payment.
 if(subscription.pending_update)return true;
 const base=subscription.items.data.find(item=>[process.env.STRIPE_STARTER_PRICE_ID,process.env.STRIPE_PRO_PRICE_ID].includes(item.price.id));
 const plan=base?.price.id===process.env.STRIPE_STARTER_PRICE_ID?'starter':'pro';
 if(!base||!validSeatQuantity(base.quantity)||!validSeatPrice(base.price,BASE_PRICES[plan])){
  // A metadata-only event during first migration still has the personal quantity.
  // An existing company with invalid billing must lose access instead of retaining old capacity.
  if(order.organization_id){const revoked=await admin.from('organization_contracts').update({active:false,updated_at:new Date().toISOString()}).eq('organization_id',order.organization_id);if(revoked.error)throw revoked.error;}
  return true;
 }
 const latest=typeof subscription.latest_invoice==='string'?await stripe.invoices.retrieve(subscription.latest_invoice):subscription.latest_invoice;
 const active=!deleted&&['active','trialing'].includes(subscription.status);
 const paid=latest?.status==='paid';
 const periodEnd=base.current_period_end;
 const result=await admin.rpc('sync_company_seat_subscription',{p_order:order.id,p_subscription:subscription.id,p_customer:customer,p_plan:plan,p_seats:base.quantity,p_until:new Date(periodEnd*1000).toISOString(),p_active:active,p_paid:paid});
 if(result.error)throw result.error;
 return true;
}
