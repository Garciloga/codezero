import Stripe from "stripe";
import { headers } from "next/headers";
import { createAdminSupabase } from "../../../../lib/admin";

const priceToPlan: Record<string, string | undefined> = {
  [process.env.STRIPE_STARTER_PRICE_ID ?? ""]: "starter",
  [process.env.STRIPE_PRO_PRICE_ID ?? ""]: "pro",
  [process.env.STRIPE_ENTERPRISE_PRICE_ID ?? ""]: "enterprise",
};

function getPlanFromSubscription(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price?.id;
  if (priceId && priceToPlan[priceId]) return priceToPlan[priceId];
  return subscription.metadata?.plan_name;
}

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return new Response("Stripe not configured", { status: 503 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const admin = createAdminSupabase();

  const { data: existing } = await admin
    .from("stripe_webhook_events")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle();

  if (existing) {
    return Response.json({ received: true, duplicate: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const plan = session.metadata?.plan_name;

    if (userId && plan) {
      const { error } = await admin
        .from("profiles")
        .update({
          plan_name: plan,
          status: "active",
          stripe_customer_id:
            typeof session.customer === "string" ? session.customer : null,
          stripe_subscription_id:
            typeof session.subscription === "string"
              ? session.subscription
              : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        return new Response("Profile update failed", { status: 500 });
      }
    }
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.user_id;
    const plan = getPlanFromSubscription(subscription);

    if (userId) {
      const usable = ["active", "trialing", "past_due"].includes(
        subscription.status
      );

      const { error } = await admin
        .from("profiles")
        .update({
          plan_name: usable && plan ? plan : "free",
          status: "active",
          stripe_customer_id:
            typeof subscription.customer === "string"
              ? subscription.customer
              : null,
          stripe_subscription_id: usable ? subscription.id : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        return new Response("Subscription sync failed", { status: 500 });
      }
    }
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId =
      typeof invoice.customer === "string" ? invoice.customer : null;

    if (customerId) {
      await admin
        .from("profiles")
        .update({
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_customer_id", customerId);
    }
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId =
      typeof invoice.customer === "string" ? invoice.customer : null;

    if (customerId) {
      await admin
        .from("profiles")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_customer_id", customerId);
    }
  }

  const { error: eventError } = await admin
    .from("stripe_webhook_events")
    .insert({
      event_id: event.id,
      event_type: event.type,
    });

  if (eventError) {
    return new Response("Webhook event log failed", { status: 500 });
  }

  return Response.json({ received: true });
}
