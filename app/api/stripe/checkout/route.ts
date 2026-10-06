import Stripe from "stripe";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "STRIPE_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  const { plan } = await req.json();

  const prices: Record<string, string | undefined> = {
    starter: process.env.STRIPE_STARTER_PRICE_ID,
    pro: process.env.STRIPE_PRO_PRICE_ID,
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  };

  const price = prices[plan];

  if (!price) {
    return NextResponse.json(
      { error: "PRICE_NOT_CONFIGURED" },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    return NextResponse.json(
      { error: "APP_URL_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    customer_email: user.email,
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
