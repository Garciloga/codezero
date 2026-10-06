import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase-server";

export async function POST(req: Request) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url), 303);
  }

  const formData = await req.formData();
  const lessonId = Number(formData.get("lesson_id"));
  const levelNumber = Number(formData.get("level_number"));
  const lessonSlug = String(formData.get("lesson_slug") ?? "");

  if (!Number.isInteger(lessonId) || !Number.isInteger(levelNumber) || !lessonSlug) {
    return NextResponse.json({ error: "INVALID_LESSON" }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { error } = await supabase.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      status: "completed",
      progress_percent: 100,
      started_at: now,
      completed_at: now,
      updated_at: now,
    },
    {
      onConflict: "user_id,lesson_id",
    }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.redirect(
    new URL(`/learn/${levelNumber}/${lessonSlug}?completed=1`, req.url),
    303
  );
}
