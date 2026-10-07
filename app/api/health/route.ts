import { NextResponse } from "next/server";
import { createAdminSupabase } from "../../../lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  try {
    const admin = createAdminSupabase();
    const { error } = await admin
      .from("levels")
      .select("id", { count: "exact", head: true });

    if (error) {
      return NextResponse.json(
        { ok: false, database: false },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        database: true,
        billingConfigured: Boolean(
          process.env.STRIPE_SECRET_KEY &&
          process.env.STRIPE_WEBHOOK_SECRET &&
          process.env.STRIPE_STARTER_PRICE_ID &&
          process.env.STRIPE_PRO_PRICE_ID &&
          process.env.STRIPE_ENTERPRISE_PRICE_ID
        ),
        aiTutorConfigured: Boolean(process.env.OPENAI_API_KEY),
        latencyMs: Date.now() - startedAt,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { ok: false, database: false },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
