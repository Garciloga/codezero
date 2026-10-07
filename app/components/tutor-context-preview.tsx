"use client";
import LocalizedContent from "./localization/client";

import { useState } from "react";
import type { TutorContext } from "../../lib/tutor-context";
export default function TutorContextPreview({lessonId}:{lessonId:number|null}){
 const [question,setQuestion]=useState("");const [context,setContext]=useState<TutorContext|null>(null);const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(!lessonId||busy)return;setBusy(true);setContext(null);setMessage("");
  try{
   const response=await fetch("/api/tutor-preview",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId,question})});
   const result=await response.json();
   if(!response.ok || result.mode!=="preparation_only")throw new Error(response.status===403||response.status===404?"Esta lección no está disponible para tu cuenta.":result.error||"No se pudo preparar el contexto");
   setContext(result.context);setMessage(result.notice);
  }catch(error){setMessage(error instanceof Error?error.message:"No se pudo preparar el contexto");}finally{setBusy(false);}
 }
 return <LocalizedContent><section className="card"><h2>Prepara tu pregunta</h2>{!lessonId&&<p>Abre esta revisión desde una lección para comprobar su contexto.</p>}
 <form onSubmit={submit}><label htmlFor="tutor-preview-question">Tu pregunta sobre la lección</label><textarea id="tutor-preview-question" minLength={5} maxLength={2000} required rows={5} value={question} onChange={event=>{setQuestion(event.target.value);setContext(null);setMessage("");}} style={{width:"100%"}}/><p>Evita incluir contraseñas, tokens o datos personales.</p><button className="btn" disabled={!lessonId||busy} type="submit">{busy?"Comprobando…":"Preparar contexto"}</button></form>
 <p role="status">{message}</p>{context&&<article><h3>Nivel {context.level}: {context.lessonTitle}</h3><p>Estado de la lección: {context.lessonState==="completed"?"Completada":context.lessonState==="in_progress"?"En curso":"Sin iniciar"}.</p><p>Práctica reciente: {context.recentPractice.correct} intentos correctos y {context.recentPractice.toReinforce} por reforzar. {context.recentPractice.window}</p><details><summary>Contenido acotado que se preparó</summary><p style={{whiteSpace:"pre-wrap"}}>{context.lessonExcerpt}</p></details><p>No se enviaron respuestas de ejercicios, soluciones de exámenes, calificaciones ni información de otros usuarios.</p></article>}</section></LocalizedContent>;
}

