"use client";
import LocalizedContent from "./components/localization/client";


import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("CodeZero page error", error);
  }, [error]);

  return (
    <LocalizedContent><main className="wrap">
      <div className="card" style={{maxWidth:720,margin:"70px auto",textAlign:"center"}}>
        <span className="pill">ERROR</span>
        <h1>Algo no salió como esperábamos</h1>
        <p className="muted">
          Puedes volver a intentarlo. Si el problema continúa, regresa a tu panel.
        </p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button className="btn" type="button" onClick={() => reset()}>Reintentar</button>
          <Link className="btn secondary" href="/dashboard">Mi CodeZero</Link>
        </div>
      </div>
    </main></LocalizedContent>
  );
}

