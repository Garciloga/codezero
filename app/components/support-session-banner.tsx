'use client';
import {useEffect,useRef} from 'react';
import LocalizedContent from './localization/client';
export default function SupportSessionBanner({expires}:{expires:number}){
 const form=useRef<HTMLFormElement>(null);
 useEffect(()=>{const timer=setTimeout(()=>form.current?.requestSubmit(),Math.max(0,expires-Date.now()));return()=>clearTimeout(timer);},[expires]);
 return <LocalizedContent><aside className="support-session-banner" aria-label="Revisión de soporte"><strong>Estás viendo la cuenta del usuario · solo lectura</strong><p>Sesión de soporte de 20 minutos. Los cambios y las compras están bloqueados.</p><form ref={form} method="post" action="/api/admin/users/return"><button className="btn secondary">Volver a mi cuenta de propietario</button></form></aside></LocalizedContent>;
}
