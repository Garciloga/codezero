"use client";
import LocalizedContent from "../../components/localization/client";
export default function TeamError({ reset }: { reset: () => void }) {
  return (
    <LocalizedContent>
      <main className="wrap">
        <h1>No pudimos cargar el equipo</h1>
        <p>Intenta nuevamente. No se muestran métricas incompletas.</p>
        <button className="btn" type="button" onClick={reset}>
          Volver a intentar
        </button>
      </main>
    </LocalizedContent>
  );
}
