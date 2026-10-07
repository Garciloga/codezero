import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { isTrustedBrowserRequest } from "../../../../lib/security";

export async function POST(req: Request) {
  if (!isTrustedBrowserRequest(req)) {
    return new Response("Invalid request origin", { status: 403 });
  }
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!stripeSecretKey || !appUrl) {
    return NextResponse.json({ error: "BILLING_NOT_CONFIGURED" }, { status: 503 });
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url), 303);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.redirect(new URL("/pricing", req.url), 303);
  }

  const stripe = new Stripe(stripeSecretKey);

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${appUrl}/profile`,
  });

  return NextResponse.redirect(session.url, 303);
}
