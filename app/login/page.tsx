"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createBrowserSupabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const supabase = createBrowserSupabase();
  const router = useRouter();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [mode,setMode]=useState<"login"|"signup">("login");
  const [msg,setMsg]=useState("");
  const [busy,setBusy]=useState(false);

  async function submit(e:FormEvent) {
    e.preventDefault();
    setMsg("");
    setBusy(true);

    try {
      if (mode === "login") {
        const result = await supabase.auth.signInWithPassword({email,password});
        if (result.error) return setMsg("No pudimos iniciar sesión. Revisa tus datos o restablece tu contraseña.");
        router.push("/dashboard");
        router.refresh();
        return;
      }

      const result = await supabase.auth.signUp({email,password});
      if (result.error) return setMsg(result.error.message);

      if (!result.data.session) {
        setMsg("Cuenta creada. Revisa tu correo y confirma tu dirección antes de iniciar sesión.");
        setMode("login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!email) {
      setMsg("Escribe primero tu email.");
      return;
    }

    setBusy(true);
    setMsg("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setBusy(false);
    setMsg(
      error
        ? "No pudimos enviar el correo de recuperación."
        : "Te enviamos un enlace para restablecer tu contraseña."
    );
  }

  return (
    <main className="wrap">
      <div className="card" style={{maxWidth:480,margin:"70px auto"}}>
        <span className="pill">CODEZERO</span>
        <h1>{mode==="login"?"Iniciar sesión":"Crear cuenta"}</h1>
        <p className="muted">
          {mode === "login"
            ? "Continúa tu ruta de aprendizaje."
            : "Empieza gratis con el Nivel 1. Puedes cambiar de plan después."}
        </p>

        <form onSubmit={submit} className="grid">
          <input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={8} required />
          <button className="btn" disabled={busy}>
            {busy ? "Procesando..." : mode==="login"?"Entrar":"Crear cuenta"}
          </button>
        </form>

        {msg && <p className="muted" style={{marginTop:14}}>{msg}</p>}

        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:14}}>
          <button className="btn secondary" type="button" onClick={()=>{setMode(mode==="login"?"signup":"login");setMsg("");}}>
            {mode==="login"?"Crear cuenta":"Ya tengo cuenta"}
          </button>
          {mode === "login" && (
            <button className="btn secondary" type="button" disabled={busy} onClick={resetPassword}>
              Olvidé mi contraseña
            </button>
          )}
        </div>

        <p className="muted" style={{fontSize:13,marginTop:20}}>
          Al crear una cuenta aceptas los <Link href="/terms">Términos</Link> y el <Link href="/privacy">Aviso de privacidad</Link>.
        </p>
      </div>
    </main>
  );
}
