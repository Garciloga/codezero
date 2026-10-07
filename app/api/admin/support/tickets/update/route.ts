import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../../../lib/supabase-server";
import { createAdminSupabase, requireAdmin } from "../../../../../../lib/admin";
import { isTrustedBrowserRequest } from "../../../../../../lib/security";
import { consumeRateLimit } from "../../../../../../lib/rate-limit";

const statuses = new Set(["open","in_progress","waiting_user","resolved","closed"]);
const priorities = new Set(["low","normal","high","urgent"]);

export async function POST(req: Request) {
  if (!isTrustedBrowserRequest(req)) {
    return new Response("Invalid request origin", { status: 403 });
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  try {
    await requireAdmin(user.id);
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const rate = await consumeRateLimit(`admin-support:${user.id}`, 60, 3600);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rate.retry_after_seconds) } }
    );
  }

  const form = await req.formData();
  const ticketId = Number(form.get("ticket_id"));
  const statusRaw = String(form.get("status") ?? "");
  const priorityRaw = String(form.get("priority") ?? "");
  const reply = String(form.get("reply") ?? "").trim();

  if (!Number.isInteger(ticketId) || !statuses.has(statusRaw) || !priorities.has(priorityRaw) || reply.length > 8000) {
    return NextResponse.json({ error: "INVALID_UPDATE" }, { status: 400 });
  }

  const { error } = await createAdminSupabase().rpc("mutate_support_ticket", {
    p_actor: user.id, p_action: "update", p_ticket: ticketId,
    p_payload: { status: statusRaw, priority: priorityRaw, body: reply },
  });
  if (error) return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 500 });
  return NextResponse.redirect(new URL("/admin?ticket=updated", req.url), 303);
}
