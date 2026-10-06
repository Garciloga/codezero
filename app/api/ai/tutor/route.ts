import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../lib/supabase-server";
import { consumeQuota } from "../../../lib/entitlements";

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "AI_TUTOR_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const { question, context } = await req.json();

  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "INVALID_QUESTION" }, { status: 400 });
  }

  const quota = await consumeQuota(user.id, "ai_queries", 1);

  if (!quota.allowed) {
    return NextResponse.json(
      { error: "AI_QUERY_LIMIT_REACHED", quota },
      { status: 429 }
    );
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-6-astra",
      instructions:
        "Eres el tutor técnico de CodeZero. Enseña paso a paso, no resuelvas ejercicios evaluados directamente y prioriza comprensión, ejemplos pequeños y preguntas guiadas. Responde en español salvo que el alumno pida otro idioma.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Contexto del curso: ${context ?? "CodeZero"}\n\nPregunta del alumno: ${question}`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
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
}
