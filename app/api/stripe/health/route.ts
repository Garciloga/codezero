import Stripe from "stripe";
import { NextResponse } from "next/server";

export async function GET() {
  const secret = process.env.STRIPE_SECRET_KEY;
  const starterPrice = process.env.STRIPE_STARTER_PRICE_ID;

  if (!secret || !starterPrice) {
    return NextResponse.json({ ok: false, configured: false }, { status: 503 });
  }

  try {
    const stripe = new Stripe(secret);
    const price = await stripe.prices.retrieve(starterPrice);

    return NextResponse.json({
      ok: true,
      configured: true,
      live: price.livemode,
      currency: price.currency,
      recurring: price.recurring?.interval ?? null,
      amount: price.unit_amount,
    });
  } catch {
    return NextResponse.json(
      { ok: false, configured: true, stripeConnection: false },
      { status: 502 }
    );
  }
}
