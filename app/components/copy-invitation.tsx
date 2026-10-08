'use client';
import {useState} from 'react';
import LocalizedContent from './localization/client';
export default function CopyInvitation({path}:{path:string}){const [status,setStatus]=useState('');return <LocalizedContent><div><a href={path}>Abrir enlace de invitación</a> <button className="btn secondary" type="button" onClick={async()=>{try{await navigator.clipboard.writeText(new URL(path,location.origin).href);setStatus('Enlace copiado');}catch{setStatus('Abre el enlace para copiar la dirección');}}}>Copiar enlace</button><p role="status">{status}</p></div></LocalizedContent>;}
