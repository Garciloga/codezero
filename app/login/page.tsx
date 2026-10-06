 "use client";
import { FormEvent, useState } from "react";
import { createBrowserSupabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const supabase = createBrowserSupabase();
  const router = useRouter();
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [mode,setMode]=useState<"login"|"signup">("login"); const [msg,setMsg]=useState("");

  async function submit(e:FormEvent) {
    e.preventDefault(); setMsg("");
    const result = mode==="login"
      ? await supabase.auth.signInWithPassword({email,password})
      : await supabase.auth.signUp({email,password});
    if (result.error) return setMsg(result.error.message);
    router.push("/dashboard");
  }
  return <main className="wrap"><div className="card" style={{maxWidth:480,margin:"70px auto"}}>
    <h1>{mode==="login"?"Iniciar sesión":"Crear cuenta"}</h1>
    <form onSubmit={submit} className="grid">
      <input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
      <input placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={8} required />
      <button className="btn">{mode==="login"?"Entrar":"Crear cuenta"}</button>
    </form>
    {msg && <p className="muted">{msg}</p>}
    <button className="btn secondary" onClick={()=>setMode(mode==="login"?"signup":"login")}>
      {mode==="login"?"Crear cuenta":"Ya tengo cuenta"}
    </button>
  </div></main>;
}
