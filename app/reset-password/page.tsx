"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createBrowserSupabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const supabase = createBrowserSupabase();
  const router = useRouter();
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [msg,setMsg]=useState("");
  const [busy,setBusy]=useState(false);

  async function submit(e:FormEvent) {
    e.preventDefault();
    setMsg("");

    if (password.length < 8) {
      setMsg("Usa una contraseña de al menos 8 caracteres.");
      return;
    }

    if (password !== confirm) {
      setMsg("Las contraseñas no coinciden.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      setMsg("El enlace puede haber expirado. Solicita uno nuevo desde Iniciar sesión.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="wrap">
      <div className="card" style={{maxWidth:480,margin:"70px auto"}}>
        <span className="pill">SEGURIDAD</span>
        <h1>Nueva contraseña</h1>
        <form onSubmit={submit} className="grid">
          <input type="password" placeholder="Nueva contraseña" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required />
          <input type="password" placeholder="Confirmar contraseña" minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)} required />
          <button className="btn" disabled={busy}>{busy ? "Guardando..." : "Guardar contraseña"}</button>
        </form>
        {msg && <p className="muted">{msg}</p>}
        <Link className="btn secondary" href="/login">Volver a iniciar sesión</Link>
      </div>
    </main>
  );
}
