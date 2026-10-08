'use client';
import LocalizedContent from '../localization/client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
export default function CompanyBrandEditor({org}:{org:string}){
 const [busy,setBusy]=useState(false),[status,setStatus]=useState('');const router=useRouter();
 async function save(kind:string,form?:HTMLFormElement){
 setBusy(true);setStatus('');try{const response=await fetch(`/api/company/${org}/brand?kind=${kind}`,{method:form?'POST':'DELETE',...(form?{body:new FormData(form)}:{})});if(!response.ok)throw Error('FAILED');setStatus('Cambios guardados.');router.refresh();}catch{setStatus('No se pudo guardar. Usa JPG, PNG o WebP de hasta 2 MB e intenta nuevamente.');}finally{setBusy(false);}}
 return <LocalizedContent><section className="card"><h2>Marca de la compañía</h2><p>Tu logo e imagen acompañan a Garciloga. Garciloga siempre permanece visible.</p>{['logo','cover'].map(kind=><form key={kind} onSubmit={e=>{e.preventDefault();void save(kind,e.currentTarget);}}><label>{kind==='logo'?'Logo de compañía':'Imagen de compañía'}<input type="file" name="image" accept="image/jpeg,image/png,image/webp" required disabled={busy}/></label><button className="btn" disabled={busy}>Subir imagen</button> <button className="btn secondary" type="button" disabled={busy} onClick={()=>void save(kind)}>Eliminar imagen</button></form>)}<p role="status">{status}</p></section></LocalizedContent>;
}
