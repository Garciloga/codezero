import Stripe from "stripe";
import { headers } from "next/headers";
import { createAdminSupabase } from "../../../../lib/admin";

const priceToPlan: Record<string, "starter" | "pro" | "enterprise" | undefined> = {
  [process.env.STRIPE_STARTER_PRICE_ID ?? ""]: "starter",
  [process.env.STRIPE_PRO_PRICE_ID ?? ""]: "pro",
  [process.env.STRIPE_ENTERPRISE_PRICE_ID ?? ""]: "enterprise",
};

function getPlanFromSubscription(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price?.id;
  return priceId ? priceToPlan[priceId] : undefined;
}

function customerIdOf(value: Stripe.Subscription["customer"] | Stripe.Invoice["customer"] | Stripe.Checkout.Session["customer"]) {
  return typeof value === "string" ? value : value?.id ?? null;
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

  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const admin = createAdminSupabase();
  const now = new Date();
  const nowIso = now.toISOString();

  const { data: existing } = await admin
    .from("stripe_webhook_events")
    .select("event_id,status,attempts,updated_at")
    .eq("event_id", event.id)
    .maybeSingle();

  if (existing?.status === "processed") {
    return Response.json({ received: true, duplicate: true });
  }

  if (
    existing?.status === "processing" &&
    existing.updated_at &&
    now.getTime() - new Date(existing.updated_at).getTime() < 5 * 60 * 1000
  ) {
    return Response.json({ received: true, processing: true });
  }

  if (existing) {
    const { error } = await admin
      .from("stripe_webhook_events")
      .update({
        status: "processing",
        attempts: Number(existing.attempts ?? 0) + 1,
        last_error: null,
        updated_at: nowIso,
      })
      .eq("event_id", event.id);

    if (error) return new Response("Webhook claim failed", { status: 500 });
  } else {
    const { error } = await admin
      .from("stripe_webhook_events")
      .insert({
        event_id: event.id,
        event_type: event.type,
        status: "processing",
        attempts: 1,
        processed_at: null,
        updated_at: nowIso,
      });

    if (error) {
      if ((error as any).code === "23505") {
        return Response.json({ received: true, duplicate: true });
      }
      return new Response("Webhook claim failed", { status: 500 });
    }
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan_name;
      const validPlan = plan === "starter" || plan === "pro" || plan === "enterprise";

      if (userId && validPlan) {
        const { error } = await admin
          .from("profiles")
          .update({
            plan_name: plan,
            stripe_customer_id: customerIdOf(session.customer),
            stripe_subscription_id:
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription?.id ?? null,
            billing_status: "active",
            stripe_cancel_at_period_end: false,
            updated_at: nowIso,
          })
          .eq("id", userId);

        if (error) throw error;
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = customerIdOf(subscription.customer);
      const metadataUserId = subscription.metadata?.user_id;
      const plan = getPlanFromSubscription(subscription);
      const usable = ["active", "trialing", "past_due"].includes(subscription.status);

      let query = admin.from("profiles").update({
        plan_name:
          event.type === "customer.subscription.deleted"
            ? "free"
            : usable && plan
              ? plan
              : "free",
        billing_status:
          event.type === "customer.subscription.deleted"
            ? "canceled"
            : subscription.status,
        stripe_cancel_at_period_end:
          event.type === "customer.subscription.deleted"
            ? false
            : Boolean(subscription.cancel_at_period_end),
        stripe_customer_id: customerId,
        stripe_subscription_id: usable ? subscription.id : null,
        updated_at: nowIso,
      });

      if (metadataUserId) {
        query = query.eq("id", metadataUserId);
      } else if (customerId) {
        query = query.eq("stripe_customer_id", customerId);
      } else {
        query = query.eq("id", "__no_matching_profile__");
      }

      const { error } = await query;
      if (error) throw error;
    }

    if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = customerIdOf(invoice.customer);

      if (customerId) {
        const { error } = await admin
          .from("profiles")
          .update({
            billing_status: event.type === "invoice.paid" ? "active" : "past_due",
            updated_at: nowIso,
          })
          .eq("stripe_customer_id", customerId)
          .not("stripe_subscription_id", "is", null);

        if (error) throw error;
      }
    }

    const { error: completeError } = await admin
      .from("stripe_webhook_events")
      .update({
        status: "processed",
        processed_at: nowIso,
        last_error: null,
        updated_at: nowIso,
      })
      .eq("event_id", event.id);

    if (completeError) throw completeError;

    return Response.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";

    await admin
      .from("stripe_webhook_events")
      .update({
        status: "failed",
        last_error: message.slice(0, 1000),
        updated_at: new Date().toISOString(),
      })
      .eq("event_id", event.id);

    return new Response("Webhook processing failed", { status: 500 });
  }
}
