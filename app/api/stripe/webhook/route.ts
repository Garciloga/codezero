import Stripe from "stripe";
import { headers } from "next/headers";
import { createAdminSupabase } from "../../../../lib/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");
  if (!signature) return new Response("Missing signature", {status:400});

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response("Invalid signature", {status:400});
  }

  const admin = createAdminSupabase();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const plan = session.metadata?.plan_name;
    if (userId && plan) {
      await admin.from("profiles").update({
        plan_name: plan,
        status: "active",
        stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
        stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : null
      }).eq("id", userId);
    }
  }

  if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.user_id;
    if (userId) {
      const active = ["active","trialing","past_due"].includes(subscription.status);
      await admin.from("profiles").update({status: active ? "active" : "suspended"}).eq("id", userId);
    }
  }

  return Response.json({received:true});
}
