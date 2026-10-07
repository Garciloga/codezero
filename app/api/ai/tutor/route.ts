import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { consumeQuota, releaseQuota } from "../../../../lib/entitlements";
import { isTrustedBrowserRequest } from "../../../../lib/security";

export async function POST(req: Request) {
  if (!isTrustedBrowserRequest(req)) {
    return new Response("Invalid request origin", { status: 403 });
  }
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.status !== "active") {
    return NextResponse.json({ error: "ACCOUNT_INACTIVE" }, { status: 403 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "AI_TUTOR_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const { question, context } = await req.json();

  if (
    !question ||
    typeof question !== "string" ||
    question.trim().length < 5 ||
    question.length > 4000
  ) {
    return NextResponse.json({ error: "INVALID_QUESTION" }, { status: 400 });
  }

  const quota = await consumeQuota(user.id, "ai_queries", 1);

  if (!quota.allowed) {
    return NextResponse.json(
      { error: "AI_QUERY_LIMIT_REACHED", quota },
      { status: 429 }
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-6-luna",
        instructions:
          "Eres el tutor técnico de CodeZero. Enseña paso a paso, no resuelvas ejercicios evaluados directamente y prioriza comprensión, ejemplos pequeños y preguntas guiadas. Responde en español salvo que el alumno pida otro idioma.",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Contexto del curso: ${String(context ?? "CodeZero").slice(0, 1500)}\n\nPregunta del alumno: ${question.trim()}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      await releaseQuota(user.id, "ai_queries", 1);
      return NextResponse.json(
        { error: "AI_PROVIDER_ERROR" },
        { status: 502 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      answer: data.output_text ?? "No fue posible generar una respuesta.",
      quota,
    });
  } catch {
    await releaseQuota(user.id, "ai_queries", 1);
    return NextResponse.json(
      { error: "AI_PROVIDER_ERROR" },
      { status: 502 }
    );
  }
}
