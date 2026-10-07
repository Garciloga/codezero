import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { isTrustedBrowserRequest } from "../../../../lib/security";
import { consumeRateLimit } from "../../../../lib/rate-limit";

export async function POST(req: Request) {
  if (!isTrustedBrowserRequest(req)) {
    return new Response("Invalid request origin", { status: 403 });
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const rate = await consumeRateLimit(`ai-checkout:${user.id}`, 5, 600);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rate.retry_after_seconds) } }
    );
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_AI_TUTOR_MONTH1_PRICE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!stripeSecretKey || !priceId || !appUrl) {
    return NextResponse.json({ error: "AI_ADDON_NOT_CONFIGURED" }, { status: 503 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "AI_TUTOR_NOT_CONFIGURED" }, { status: 503 });
  }

  const [{ data: profile }, { data: addon }] = await Promise.all([
    supabase
      .from("profiles")
      .select("status,stripe_customer_id")
      .eq("id", user.id)
      .single(),
    supabase
      .from("account_addons")
      .select("status,stripe_subscription_id")
      .eq("user_id", user.id)
      .eq("addon_key", "ai_tutor")
      .maybeSingle(),
  ]);

  if (!profile || profile.status !== "active") {
    return NextResponse.json({ error: "ACCOUNT_INACTIVE" }, { status: 403 });
  }

  if (addon && ["active", "past_due", "incomplete"].includes(addon.status)) {
    return NextResponse.json({ error: "AI_ADDON_ALREADY_EXISTS" }, { status: 409 });
  }

  const stripe = new Stripe(stripeSecretKey);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    ...(profile.stripe_customer_id
      ? { customer: profile.stripe_customer_id }
      : { customer_email: user.email ?? undefined }),
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id,
    metadata: {
      user_id: user.id,
      addon_key: "ai_tutor",
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        addon_key: "ai_tutor",
      },
    },
    success_url: `${appUrl}/profile?ai=success`,
    cancel_url: `${appUrl}/profile?ai=cancelled`,
  });

  if (!session.url) {
    return NextResponse.json({ error: "CHECKOUT_URL_NOT_CREATED" }, { status: 500 });
  }

  return NextResponse.redirect(session.url, 303);
}
