"use client";
import {useState} from "react";
import {ownerDemoCopy} from "../../lib/localization/owner-demo";

export default function OwnerSelfReset({locale}:{locale:string}){
 const t=ownerDemoCopy(locale);
 const [email,setEmail]=useState("");
 const [phrase,setPhrase]=useState("");
 const [ack,setAck]=useState(false);
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState("");
 const [requestId,setRequestId]=useState(()=>crypto.randomUUID());
 async function reset(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy||!ack||phrase!=="REINICIAR MI PROGRESO")return;
  setBusy(true);setStatus("");
  try{
   const form=new FormData();
   form.set("confirm_email",email.trim());
   form.set("confirm_phrase",phrase);
   form.set("understood","1");
   form.set("request_id",requestId);
   const response=await fetch("/api/admin/owner-self-reset",{method:"POST",body:form,cache:"no-store"});
   const body=await response.json().catch(()=>({}));
   if(response.ok&&body.reset){
    setStatus(t.resetDone);
    setEmail("");setPhrase("");setAck(false);setRequestId(crypto.randomUUID());
   }else{
    setStatus(t.resetError+" ("+String(body.error??response.status)+")");
   }
  }catch{setStatus(t.resetError);}finally{setBusy(false);}
 }
 return <section className="card">
  <h2>{t.resetTitle}</h2><p>{t.resetIntro}</p>
  <p role="note">{t.resetWarning}</p>
  <form onSubmit={reset}>
   <label>{t.email}<input type="email" autoComplete="off" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></label>
   <label>{t.phrase}<input required autoComplete="off" value={phrase} onChange={e=>setPhrase(e.target.value)} maxLength={40}/></label>
   <label style={{display:"flex",alignItems:"flex-start",gap:8}}><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)} required/><span>{t.confirm}</span></label>
   <button className="btn" type="submit" disabled={!ack||phrase!=="REINICIAR MI PROGRESO"||busy}>{busy?t.resetBusy:t.resetButton}</button>
  </form>
  {status&&<p role="status">{status}</p>}
 </section>;
}
