import Stripe from "stripe";
import { randomInt } from "node:crypto";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { NextResponse } from "next/server";
import { isTrustedBrowserRequest } from "../../../../lib/security";
import { consumeRateLimit } from "../../../../lib/rate-limit";

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

  const rate = await consumeRateLimit(`checkout:${user.id}`, 5, 600);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rate.retry_after_seconds) } }
    );
  }

  let payload: { plan?: string; paymentAuthorization?: boolean };

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const { plan, paymentAuthorization } = payload;

  if (paymentAuthorization !== true) {
    return NextResponse.json({ error: "PAYMENT_AUTHORIZATION_REQUIRED" }, { status: 400 });
  }

  if (plan === "enterprise") return NextResponse.json({error:"CONTACT_REQUIRED"},{status:409});
  if (typeof plan !== "string" || !["starter", "pro"].includes(plan)) {
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
    .select("status, plan_name, stripe_customer_id, stripe_subscription_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.status !== "active") {
    return NextResponse.json({ error: "ACCOUNT_INACTIVE" }, { status: 403 });
  }

  if (
    profile.stripe_customer_id &&
    profile.stripe_subscription_id &&
    profile.plan_name &&
    profile.plan_name !== "free"
  ) {
    const portal = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/profile`,
    });

    return NextResponse.json({ url: portal.url, existingSubscription: true });
  }

  const session = await stripe.checkout.sessions.create({
    integration_identifier: "codezero-base-" + Array.from({length:8},()=>String.fromCharCode(97+randomInt(26))).join(""),
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    ...(profile.stripe_customer_id
      ? { customer: profile.stripe_customer_id }
      : { customer_email: user.email }),
    client_reference_id: user.id,
    metadata: {
      user_id: user.id,
      plan_name: plan,
      terms_version: "2026-10-06",
      payment_authorization_confirmed: "true",
      payment_authorization_confirmed_at: new Date().toISOString(),
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        plan_name: plan,
        terms_version: "2026-10-06",
        payment_authorization_confirmed: "true",
      },
    },
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}

