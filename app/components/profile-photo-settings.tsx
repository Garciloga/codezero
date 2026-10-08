"use client";
import LocalizedContent from "./localization/client";
import {useRef,useState} from "react";
import ProfileAvatar,{PHOTO_EVENT} from "./profile-avatar";
export default function ProfilePhotoSettings({name,initialVersion}:{name:string;initialVersion?:string|null}) {
  const [version,setVersion]=useState(initialVersion);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  const fileInput=useRef<HTMLInputElement>(null);
  async function save(remove=false) {
    const file=fileInput.current?.files?.[0];
    if(!remove && (!file || file.size>2097152 || !["image/jpeg","image/png","image/webp"].includes(file.type))) {setMessage("Elige una imagen JPG, PNG o WebP de hasta 2 MB.");return;}
    setSaving(true);setMessage("");
    try {
      const form=new FormData();if(file)form.set("photo",file);
      const response=await fetch("/api/profile/photo",{method:remove?"DELETE":"POST",...(remove?{}:{body:form})});
      const result=await response.json();
      if(!response.ok) throw new Error(result.error);
      setVersion(result.version);window.dispatchEvent(new CustomEvent(PHOTO_EVENT,{detail:{version:result.version}}));
      if(fileInput.current)fileInput.current.value="";
      setMessage(remove?"Foto eliminada.":"Foto de perfil guardada.");
    } catch {setMessage("No pudimos guardar el cambio. Revisa que la imagen sea válida e intenta nuevamente.");}
    finally {setSaving(false);}
  }
  return <LocalizedContent><section aria-labelledby="photo-heading" aria-busy={saving}>
    <h3 id="photo-heading">Foto de perfil</h3><ProfileAvatar name={name} version={version}/>
    <p className="muted">JPG, PNG o WebP, hasta 2 MB. Puedes reemplazar o eliminar tu foto cuando quieras.</p>
    <label htmlFor="profile-photo">Seleccionar foto</label>
    <input ref={fileInput} id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={saving}/>
    <div className="appearance-options" style={{marginTop:12}}><button type="button" className="btn secondary" disabled={saving} onClick={()=>save()}>Subir foto</button>
    <button type="button" className="btn secondary" disabled={saving || !version} onClick={()=>save(true)}>Eliminar foto</button></div>
    <p role="status" aria-live="polite">{message}</p>
  </section></LocalizedContent>;
}
