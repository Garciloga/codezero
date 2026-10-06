"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function TutorPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setAnswer("");

    try {
      const response = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          context: "Ruta completa de CodeZero: programación, web, APIs, SaaS e integraciones empresariales.",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "AI_TUTOR_NOT_CONFIGURED") {
          setError("El Tutor IA todavía no está conectado al proveedor de IA.");
        } else if (data.error === "AI_QUERY_LIMIT_REACHED") {
          setError("Alcanzaste el límite mensual de consultas de IA de tu plan.");
        } else {
          setError("No fue posible obtener una respuesta en este momento.");
        }
        return;
      }

      setAnswer(data.answer ?? "");
    } catch {
      setError("No fue posible conectar con el Tutor IA.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="wrap">
      <div className="nav">
        <div>
          <span className="pill">TUTOR IA</span>
          <h1>Pregunta a CodeZero</h1>
          <p className="muted">
            Recibe explicaciones guiadas sobre los conceptos de tu ruta.
          </p>
        </div>

        <Link className="btn secondary" href="/dashboard">
          Volver a Mi CodeZero
        </Link>
      </div>

      <div className="grid grid2">
        <section className="card">
          <h2>Tu pregunta</h2>

          <form onSubmit={submit}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              minLength={5}
              rows={10}
              placeholder="Ejemplo: ¿Cuál es la diferencia entre una API y un webhook?"
              style={{
                width: "100%",
                padding: 14,
                border: "1px solid #d8dee8",
                borderRadius: 12,
                font: "inherit",
              }}
            />

            <button className="btn" type="submit" disabled={loading} style={{ marginTop: 14 }}>
              {loading ? "Pensando..." : "Preguntar"}
            </button>
          </form>
        </section>

        <section className="card">
          <h2>Respuesta</h2>

          {error && <p>{error}</p>}

          {answer ? (
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.75 }}>{answer}</p>
          ) : (
            <p className="muted">
              La respuesta del tutor aparecerá aquí.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
