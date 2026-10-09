import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { canAccessLevel, getLessonLevel } from "../../../../lib/access";
import { createAdminSupabase } from "../../../../lib/admin";
import { isTrustedBrowserRequest } from "../../../../lib/security";
import { consumeRateLimit } from "../../../../lib/rate-limit";
import { maybeIssueWorkspaceDiploma } from "../../../../lib/workspace-diploma-server";

import { lessonGate } from "../../../../lib/lesson-gate";
import { canCompleteLesson } from "../../../../lib/lesson-rules";
import { boundedForm, FORM_LIMIT_BYTES } from "../../../../lib/bounded-form";
export async function POST(req: Request) {
  if (!isTrustedBrowserRequest(req)) {
    return new Response("Invalid request origin", { status: 403 });
  }
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  const rate = await consumeRateLimit(`lesson:${user.id}`, 60, 60);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rate.retry_after_seconds) } }
    );
  }

  const formData = await boundedForm(req, FORM_LIMIT_BYTES).catch(() => null);

  if (!formData) return new Response(null, { status: 413 });
  const lessonId = Number(formData.get("lesson_id"));

  if (!Number.isInteger(lessonId)) {
    return NextResponse.json({ error: "INVALID_LESSON" }, { status: 400 });
  }

  const resolved = await getLessonLevel(lessonId);
  if (!resolved) {
    return NextResponse.json({ error: "LESSON_NOT_FOUND" }, { status: 404 });
  }

  const { lesson, levelNumber } = resolved;
  if (!(await canAccessLevel(user.id, levelNumber))) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const lessonUrl = (query: string) => new URL(`/learn/${levelNumber}/${lesson.slug}?${query}`, req.url);
  // Evidence is read on the server; nothing the browser sends can declare a lesson passed.
  const gate = await lessonGate(user.id, lessonId, Number(lesson.level_id));
  // Idempotent: a completed lesson (historical or verified) is never rewritten.
  if (gate.completed) return NextResponse.redirect(lessonUrl("completed=1"), 303);
  if (!gate.unlocked) return NextResponse.redirect(new URL(`/learn/${levelNumber}?locked=1`, req.url), 303);
  if (!canCompleteLesson(gate)) return NextResponse.redirect(lessonUrl("completed=blocked"), 303);

  const now = new Date().toISOString();
  const admin = createAdminSupabase();
  const { error } = await admin.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      status: "completed",
      progress_percent: 100,
      started_at: now,
      completed_at: now,
      verified_at: now,
      updated_at: now,
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await maybeIssueWorkspaceDiploma(user.id,levelNumber);

  return NextResponse.redirect(lessonUrl("completed=1"), 303);
}
