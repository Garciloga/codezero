"use client";
import {useState,type FormEvent} from 'react';
import LocalizedContent from './localization/client';
export default function OwnerUserCreate(){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[link,setLink]=useState('');
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const form=event.currentTarget;setBusy(true);setMessage('');setLink('');
  try{const response=await fetch('/api/admin/users/create',{method:'POST',body:new FormData(form)});const result=await response.json();
   if(!response.ok){setMessage(result.error==='USER_EXISTS'?'El usuario ya existe. Puedes cambiar su acceso en la tabla de usuarios.':result.error==='ACCESS_PENDING'?'La cuenta se creó, pero falta asignar el acceso. Búscala en la tabla de usuarios para completar el alta.':'No se pudo crear. Revisa los datos e inténtalo nuevamente.');return;}
   setLink(result.setupUrl);setMessage('Usuario creado sin cobro ni suscripción de Stripe. Comparte el enlace con su destinatario para verificar el correo y elegir su contraseña.');form.reset();
  }catch{setMessage('No pudimos confirmar el alta. Actualiza la tabla antes de volver a intentarlo.');}finally{setBusy(false);}
 }
 return <LocalizedContent><section className="card"><h2>Agregar usuario sin Stripe</h2><p>Solo el propietario de Garciloga puede dar este acceso. Las cuentas nuevas son alumnos; este formulario nunca crea propietarios ni administradores.</p>
 <form className="owner-user-form" onSubmit={submit}><label>Nombre completo<input name="full_name" minLength={2} maxLength={100} required autoComplete="off"/></label><label>Correo del usuario<input name="email" type="email" maxLength={200} required autoComplete="off"/></label><label>Acceso asignado<select name="plan_name" defaultValue="free"><option value="free">Free</option><option value="starter">Starter</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option></select></label><button className="btn" disabled={busy}>{busy?'Creando…':'Crear usuario sin cobro'}</button></form>
 <p role="status">{message}</p>{link&&<><label>Enlace privado de activación<textarea className="setup-link" readOnly rows={4} value={link}/></label><button type="button" className="btn secondary" onClick={async()=>{try{await navigator.clipboard.writeText(link);setMessage('Enlace copiado. Compártelo únicamente con el destinatario.');}catch{setMessage('Selecciona y copia el enlace de activación.');}}}>Copiar enlace</button><p>El enlace es de un solo uso y vence según la configuración de autenticación. No se envía correo automáticamente.</p><a className="btn secondary" href="/admin">Actualizar tabla de usuarios</a></>}</section></LocalizedContent>;
}
