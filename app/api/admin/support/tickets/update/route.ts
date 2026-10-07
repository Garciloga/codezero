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

  const admin = createAdminSupabase();
  const { data: before } = await admin
    .from("support_tickets")
    .select("id,status,priority,user_id")
    .eq("id", ticketId)
    .maybeSingle();

  if (!before) return NextResponse.json({ error: "TICKET_NOT_FOUND" }, { status: 404 });

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    status: statusRaw,
    priority: priorityRaw,
    assigned_to: user.id,
    updated_at: now,
    resolved_at: statusRaw === "resolved" ? now : null,
    closed_at: statusRaw === "closed" ? now : null,
  };

  const { error } = await admin.from("support_tickets").update(update).eq("id", ticketId);
  if (error) return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 500 });

  if (reply) {
    await admin.from("support_ticket_messages").insert({
      ticket_id: ticketId,
      sender_user_id: user.id,
      sender_role: "admin",
      body: reply,
    });
  }

  await admin.from("admin_audit_log").insert({
    actor_user_id: user.id,
    action: "support_ticket_updated",
    target_type: "support_ticket",
    target_id: String(ticketId),
    metadata: {
      before: { status: before.status, priority: before.priority },
      after: { status: statusRaw, priority: priorityRaw, replied: Boolean(reply) },
    },
  });

  return NextResponse.redirect(new URL("/admin?ticket=updated", req.url), 303);
}
