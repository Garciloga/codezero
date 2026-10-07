import Stripe from "stripe";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { NextResponse } from "next/server";
import { isTrustedBrowserRequest } from "../../../../lib/security";

export async function POST(req: Request) {
  if (!isTrustedBrowserRequest(req)) {
    return new Response("Invalid request origin", { status: 403 });
  }
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!stripeSecretKey) {
    return NextResponse.json({ error: "STRIPE_NOT_CONFIGURED" }, { status: 503 });
  }

  if (!appUrl) {
    return NextResponse.json({ error: "APP_URL_NOT_CONFIGURED" }, { status: 503 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const { plan, paymentAuthorization } = await req.json();

  if (paymentAuthorization !== true) {
    return NextResponse.json({ error: "PAYMENT_AUTHORIZATION_REQUIRED" }, { status: 400 });
  }

  if (!["starter", "pro", "enterprise"].includes(plan)) {
    return NextResponse.json({ error: "INVALID_PLAN" }, { status: 400 });
  }

  const prices: Record<string, string | undefined> = {
    starter: process.env.STRIPE_STARTER_PRICE_ID,
    pro: process.env.STRIPE_PRO_PRICE_ID,
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  };

  const price = prices[plan];

  if (!price) {
    return NextResponse.json({ error: "PRICE_NOT_CONFIGURED" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_name, stripe_customer_id, stripe_subscription_id")
    .eq("id", user.id)
    .single();

  if (
    profile?.stripe_customer_id &&
    profile?.stripe_subscription_id &&
    profile?.plan_name &&
    profile.plan_name !== "free"
  ) {
    const portal = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/profile`,
    });

    return NextResponse.json({ url: portal.url, existingSubscription: true });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    ...(profile?.stripe_customer_id
      ? { customer: profile.stripe_customer_id }
      : { customer_email: user.email }),
    client_reference_id: user.id,
    metadata: {
      user_id: user.id,
      plan_name: plan,
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        plan_name: plan,
      },
    },
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
