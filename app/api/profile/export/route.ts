import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { consumeRateLimit } from "../../../../lib/rate-limit";

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const rate = await consumeRateLimit(`profile-export:${user.id}`, 5, 3600);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rate.retry_after_seconds) } }
    );
  }

  const [
    profile,
    progress,
    lessonProgress,
    exerciseAttempts,
    examAttempts,
    projectSubmissions,
    certificates,
    usage,
  ] = await Promise.all([
    supabase.from("profiles")
      .select("id,email,full_name,role,plan_name,status,billing_status,stripe_cancel_at_period_end,created_at,updated_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("progress")
      .select("*")
      .eq("user_id", user.id),
    supabase.from("lesson_progress")
      .select("lesson_id,status,completed_at,created_at,updated_at")
      .eq("user_id", user.id),
    supabase.from("exercise_attempts")
      .select("exercise_id,answer,is_correct,created_at")
      .eq("user_id", user.id),
    supabase.from("exam_attempts")
      .select("exam_id,score,passed,answers,created_at")
      .eq("user_id", user.id),
    supabase.from("project_submissions")
      .select("project_id,submission_text,status,score,feedback,created_at,updated_at")
      .eq("user_id", user.id),
    supabase.from("certificates")
      .select("id,certificate_type,title,issued_at,metadata")
      .eq("user_id", user.id),
    supabase.from("usage_monthly")
      .select("period_start,exercises,exams,ai_queries,projects")
      .eq("user_id", user.id)
      .order("period_start", { ascending: true }),
  ]);

  const queries = [
    profile,
    progress,
    lessonProgress,
    exerciseAttempts,
    examAttempts,
    projectSubmissions,
    certificates,
    usage,
  ];

  const firstError = queries.find((query) => query.error)?.error;
  if (firstError) {
    return NextResponse.json({ error: "EXPORT_FAILED" }, { status: 500 });
  }

  const body = JSON.stringify({
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email ?? null,
      profile: profile.data,
    },
    learning: {
      progress: progress.data ?? [],
      lesson_progress: lessonProgress.data ?? [],
      exercise_attempts: exerciseAttempts.data ?? [],
      exam_attempts: examAttempts.data ?? [],
      project_submissions: projectSubmissions.data ?? [],
      certificates: certificates.data ?? [],
    },
    usage: usage.data ?? [],
  }, null, 2);

  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="codezero-data-export.json"',
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
