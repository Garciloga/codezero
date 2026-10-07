"use client";
import { useState } from "react";
export default function AddonWaitlistButton({ addonKey, enabled, initial = false }: { addonKey: string; enabled: boolean; initial?: boolean }) {
 const [interested,setInterested]=useState(initial);const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 async function toggle(){
  if(busy)return;setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/addon-waitlist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:addonKey,interested:!interested})});
   const body=await response.json();if(!response.ok || typeof body.interested!=="boolean")throw new Error(body.error||"No se pudo guardar");
   setInterested(body.interested);setMessage(body.interested?"Interés privado guardado. No genera cobros ni garantiza fecha de lanzamiento.":"Interés retirado.");
  }catch(error){setMessage(error instanceof Error?error.message:"No se pudo guardar");}finally{setBusy(false);}
 }
 return <><button type="button" className="btn secondary" disabled={!enabled||busy} aria-pressed={interested} onClick={toggle}>{busy?"Guardando…":interested?"Retirar mi interés":"Me interesa · lista de espera"}</button>{!enabled&&<p className="muted">Requiere una cuenta activa.</p>}<p role="status">{message}</p></>;
}
