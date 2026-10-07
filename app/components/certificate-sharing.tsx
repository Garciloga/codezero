'use client';
import LocalizedContent from "./localization/client";

import {useState} from 'react';
export default function CertificateSharing({certificateId,initialPath,displayName}:{certificateId:string;initialPath:string|null;displayName:string}){
 const [path,setPath]=useState(initialPath),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function change(enabled:boolean){setBusy(true);setError('');try{const r=await fetch('/api/certificates/share',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({certificateId,enabled,consent})});const data=await r.json();if(!r.ok)throw Error();setPath(data.path);}catch{setError('No fue posible actualizar la publicación. Intenta nuevamente.');}finally{setBusy(false);}}
 return <LocalizedContent><section className="card" style={{marginTop:24}}><h2>Comparte tu certificado</h2><p>El enlace público muestra <span translate="no">{displayName}</span>, el título y la fecha de emisión. Puedes retirarlo cuando quieras.</p>{path?<><p><a href={path}>Abrir verificación pública</a></p><button type="button" className="btn secondary" disabled={busy} onClick={()=>change(false)}>Retirar enlace público</button></>:<><label><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> Autorizo publicar mi nombre y los datos de este certificado.</label><p><button type="button" className="btn" disabled={busy||!consent} onClick={()=>change(true)}>Crear enlace verificable</button></p></>}<p role="status">{error|| (busy?'Guardando…':'')}</p></section></LocalizedContent>;
}

