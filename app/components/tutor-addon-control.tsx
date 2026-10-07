'use client';
import { useLanguage } from "./localization/provider";
import { LANGUAGE_TAGS } from "../../lib/localization/shared";
import LocalizedContent from "./localization/client";
import {useState} from 'react';
export default function TutorAddonControl({included,active}:{included:boolean;active:boolean}){const {locale}=useLanguage();
 const [consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function submit(){setBusy(true);setMessage('');try{const r=await fetch('/api/ai/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:active?'cancel':'add',paymentAuthorization:consent})});const data=await r.json();if(!r.ok){setMessage(data.error==='BILLING_RECONCILIATION_REQUIRED'?'Tu solicitud requiere revisión de facturación. No la repetiremos automáticamente.':'No fue posible programar el cambio. El plan base no se modificó por esta solicitud.');return;}setMessage(`Cambio programado para ${new Date(data.effectiveAt).toLocaleDateString(LANGUAGE_TAGS[locale])}. Tu plan base se conserva.`);}catch{setMessage('No recibimos confirmación. Consulta facturación antes de repetir la solicitud.');}finally{setBusy(false);}}
 if(included)return <LocalizedContent><p>Incluido con Pro, sin cobro adicional. <a href="/tutor">Abrir Tutor</a></p></LocalizedContent>;
 return <LocalizedContent><div><p>{active?'La cancelación surte efecto al terminar el periodo actual.':'Se agrega a la misma suscripción de Starter en tu próxima renovación: $50 el primer mes del Tutor y $100 al mes desde el segundo. Sin cargo inmediato.'}</p><label><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> {active?'Confirmo cancelar únicamente el Tutor.':'Autorizo estos cobros mensuales adicionales en MXN.'}</label><p><button className="btn" type="button" disabled={!consent||busy} onClick={submit}>{busy?'Programando…':active?'Cancelar Tutor':'Agregar Tutor'}</button></p><p role="status">{message}</p></div></LocalizedContent>;
}

