/** No live Stripe access. A fail-closed check of separate TEST credentials. */
export type StripeTestEnv={STRIPE_TEST_SECRET_KEY?:string;STRIPE_TEST_WEBHOOK_SECRET?:string;STRIPE_TEST_STARTER_PRICE_ID?:string;STRIPE_TEST_PRO_PRICE_ID?:string;STRIPE_TEST_APP_URL?:string};
export function stripeTestReadiness(env:StripeTestEnv){
 const required=["STRIPE_TEST_SECRET_KEY","STRIPE_TEST_WEBHOOK_SECRET","STRIPE_TEST_STARTER_PRICE_ID","STRIPE_TEST_PRO_PRICE_ID","STRIPE_TEST_APP_URL"] as const;
 const missing=required.filter(k=>!env[k]?.trim());
 if(missing.length)return {ready:false,missing,reasons:["Configure an isolated Stripe Test environment; never use live credentials."]};
 const reasons:string[]=[];
 if(!env.STRIPE_TEST_SECRET_KEY!.startsWith("sk_test_"))reasons.push("STRIPE_TEST_SECRET_KEY must be a test key");
 if(!env.STRIPE_TEST_WEBHOOK_SECRET!.startsWith("whsec_"))reasons.push("Missing test webhook signing secret");
 for(const key of ["STRIPE_TEST_STARTER_PRICE_ID","STRIPE_TEST_PRO_PRICE_ID"] as const)
  if(!/^price_[A-Za-z0-9]+$/.test(env[key]!))reasons.push(key+" is not a Stripe price identifier");
 try{const u=new URL(env.STRIPE_TEST_APP_URL!);if(!["http:","https:"].includes(u.protocol))reasons.push("Test callback URL must be HTTP(S)");}catch{reasons.push("Test callback URL is invalid");}
 return {ready:reasons.length===0,missing,reasons};
}
