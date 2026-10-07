"use client";

import { useEffect, useRef, useState } from "react";
import { boundedRuntimeResult } from "../../lib/code-runtime-policy";
import { RUNTIME_CHALLENGES } from "../../lib/runtime-challenges";

type Language = "python" | "sql";
const samples: Record<Language, string> = {
  python: 'cuentas = [\n    {"nombre": "Faro", "estado": "activo", "asientos": 3},\n    {"nombre": "Nube", "estado": "inactivo", "asientos": 2},\n    {"nombre": "Puente", "estado": "activo", "asientos": 5},\n]\n\nfor cuenta in cuentas:\n    if cuenta["estado"] == "activo":\n        print(cuenta["nombre"])\n',
  sql: "SELECT nombre, asientos\nFROM cuentas\nWHERE estado = 'activo'\nORDER BY id;",
};
type Session = { id: string; channel: string; language: Language; code: string };
type Result = NonNullable<ReturnType<typeof boundedRuntimeResult>>;

export default function BrowserCodePractice({ runtimeOrigin, appOrigin }: { runtimeOrigin: string; appOrigin: string }) {
  const [language, setLanguage] = useState<Language>("python");
  const [challengeId,setChallengeId] = useState<string>('python-list');
  const challenge = RUNTIME_CHALLENGES.find(item=>item.id===challengeId)!;
  const [code, setCode] = useState(samples.python); const [session, setSession] = useState<Session | null>(null);
  const [phase, setPhase] = useState(""); const [result, setResult] = useState<Result | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!session) return;
    let sent = false; let running = false;
    let timer = setTimeout(() => {
      setResult({ status: "timeout", stdout: "", error: "No se pudo cargar el motor aislado. Comprueba que esté iniciado.", truncated: false }); setSession(null); setPhase("");
    }, 30000);
    function receive(event: MessageEvent) {
      // A separate cookie hostname/origin is required before rendering this frame.
      if (event.origin !== runtimeOrigin || event.source !== frame.current?.contentWindow || event.data?.channel !== session!.channel) return;
      if (event.data.type === "frame_ready" && !sent) {
        sent = true; frame.current?.contentWindow?.postMessage({ type: "run", ...session }, runtimeOrigin);
      } else if (event.data.type === "running" && event.data.id === session!.id && !running) {
        running = true; setPhase("Ejecutando tu práctica…"); clearTimeout(timer);
        timer = setTimeout(() => {
          setResult({ status: "timeout", stdout: "", error: "La ejecución excedió el tiempo de práctica.", truncated: false }); setSession(null); setPhase("");
        }, 5000);
      } else {
        const next = boundedRuntimeResult(event.data, session!.id);
        if (next) { clearTimeout(timer); setResult(next); setSession(null); setPhase(""); }
      }
    }
    window.addEventListener("message", receive);
    return () => { clearTimeout(timer); window.removeEventListener("message", receive); };
  }, [session, runtimeOrigin]);

  function stop() {
    if (session) frame.current?.contentWindow?.postMessage({ type: "cancel", id: session.id, channel: session.channel }, runtimeOrigin);
    setSession(null); setPhase(""); setResult({ status: "cancelled", stdout: "", error: "Ejecución detenida.", truncated: false });
  }
  function choose(id:string) {const next=RUNTIME_CHALLENGES.find(item=>item.id===id);if(!next)return;stop();setChallengeId(next.id);setLanguage(next.language);setCode(next.starter);setResult(null);}
  function reset(next = language) { choose(next===language ? challengeId : RUNTIME_CHALLENGES.find(item=>item.language===next)!.id); }

  return <section className="card browser-code-practice" style={{ marginTop: 24 }}>
    <span className="pill">CÓDIGO EJECUTABLE · REVISIÓN LOCAL</span><h2>Escribe, ejecuta y explica</h2>
    <p>Prueba con cuentas ficticias. Cada ejecución empieza de cero y su resultado no cuenta como examen, avance o diploma.</p>
    <label htmlFor="practice-language">Lenguaje</label>{" "}<select id="practice-language" value={language} disabled={!!session} onChange={event => reset(event.target.value as Language)}><option value="python">Python</option><option value="sql">SQL · SQLite</option></select>
    <label htmlFor="practice-challenge">Reto de práctica</label>{" "}<select id="practice-challenge" disabled={!!session} value={challengeId} onChange={event=>choose(event.target.value)}>{RUNTIME_CHALLENGES.filter(item=>item.language===language).map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select>
    <p><b>Reto:</b> {challenge.task}</p><p>{challenge.explain}</p>
    {language === "sql" && <p>Tabla <code>cuentas(id, nombre, estado, asientos)</code>: Faro (activo, 3), Nube (inactivo, 2) y Puente (activo, 5). Usa <code>LIMIT</code> para limitar resultados.</p>}
    <form onSubmit={event => {
      event.preventDefault();
      if (session || !code.trim() || code.length > 8000 || window.location.origin !== appOrigin) return;
      setResult(null); setPhase("Cargando el motor de práctica…");
      setSession({ id: crypto.randomUUID(), channel: crypto.randomUUID(), code, language });
    }}>
      <label htmlFor="practice-code">Tu código de {language === "python" ? "Python" : "SQL"}</label>
      <textarea id="practice-code" name="practice-code" value={code} maxLength={8000} required disabled={!!session} rows={12} spellCheck={false}
        style={{ display: "block", width: "100%", boxSizing: "border-box", fontFamily: "monospace", margin: "12px 0", resize: "vertical" }}
        onChange={event => { setCode(event.target.value); setResult(null); }} />
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button className="btn" type="submit" disabled={!!session || !code.trim()}>Ejecutar código</button>
        <button className="btn secondary" type="button" disabled={!session} onClick={stop}>Detener ejecución</button>
        <button className="btn secondary" type="button" onClick={() => reset()}>Restaurar ejemplo</button>
      </div>
    </form>
    <p className="muted">Hasta 8,000 caracteres, 3 segundos de ejecución, 50 filas y 4,096 caracteres de salida. No introduzcas datos reales, contraseñas o tokens.</p>
    <p role="status" aria-live="polite">{phase || (result ? result.status === "complete" ? "Práctica ejecutada." : result.error : "El motor se carga cuando ejecutas el código.")}</p>
    {result && <><h3>Salida</h3><pre tabIndex={0} aria-label="Salida del código" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxHeight: 320, overflow: "auto" }}>{result.stdout || "Sin salida."}</pre>
      {result.truncated && <p>Se alcanzó un límite de salida; reduce el resultado antes de volver a ejecutar.</p>}
      <details><summary>Comparar con la salida esperada</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{challenge.expected}</pre><p>Comparación formativa. Explica el proceso y los casos límite; la coincidencia de salida no acredita una competencia.</p></details></>}
    {session && <iframe ref={frame} key={session.channel} title="Motor aislado de práctica" hidden tabIndex={-1} aria-hidden="true" sandbox="allow-scripts allow-same-origin" referrerPolicy="no-referrer"
      src={`${runtimeOrigin}/frame#channel=${session.channel}`} />}
  </section>;
}
