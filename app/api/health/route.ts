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
