"use client";
import LineIcon from "./line-icon";
import LocalizedContent from "./localization/client";

import { useEffect, useState } from "react";
import { ACCENTS, DEFAULT_APPEARANCE, appearanceStorageKey, parseAppearance, type Appearance } from "../../lib/user-appearance";
import { APPEARANCE_EVENT } from "./appearance-provider";
export default function AppearanceSettings({ userId, initialPreference, syncEnabled=false }: { userId: string | null; initialPreference?: unknown; syncEnabled?: boolean }) {
  const [preference, setPreference] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [message, setMessage] = useState("");
  useEffect(() => {
    try { setPreference(parseAppearance(initialPreference ?? JSON.parse(localStorage.getItem(appearanceStorageKey(userId)) ?? "null"))); }
    catch { setPreference({ ...DEFAULT_APPEARANCE }); }
  }, [userId, initialPreference]);
  const [saving,setSaving] = useState(false);
  async function save(next: Appearance) {
    if (saving) return;
    setSaving(true);
    if (syncEnabled) {
      try {
        const response = await fetch("/api/preferences",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(next)});
        if (!response.ok) throw new Error("SAVE_FAILED");
      } catch {setMessage("No pudimos sincronizar tu apariencia. Intenta nuevamente.");setSaving(false);return;}
    }
    try {
      localStorage.setItem(appearanceStorageKey(userId), JSON.stringify(next));
      setPreference(next);
      window.dispatchEvent(new CustomEvent(APPEARANCE_EVENT,{detail:{userId,preference:next}}));
      setMessage(syncEnabled ? "Apariencia sincronizada para tu cuenta." : userId ? "Apariencia guardada para tu cuenta en este navegador." : "Apariencia guardada en este navegador.");
    } catch {
      if (syncEnabled) {
        setPreference(next);
        window.dispatchEvent(new CustomEvent(APPEARANCE_EVENT,{detail:{userId,preference:next}}));
      }
      setMessage(syncEnabled ? "Guardado en tu cuenta; este navegador no permite conservar la copia local." : "Este navegador no permite guardar preferencias. No se modificaron tus ajustes.");
    }
    setSaving(false);
  }
  return <LocalizedContent><section className="card appearance-settings" style={{ marginTop: 18 }} aria-labelledby="appearance-heading" aria-busy={saving}>
    <span className="pill">A TU MANERA</span><h2 id="appearance-heading">Personaliza Garciloga</h2>
    <p className="muted">Elige modo claro, oscuro o automático y el color de tus botones.</p>
    <fieldset disabled={saving}><legend>Modo de pantalla</legend><div className="appearance-options">
      {([{key:"system",label:"Dispositivo",detail:"Sigue tu preferencia del sistema"},{key:"light",label:"Claro",detail:"Una superficie luminosa"},{key:"dark",label:"Oscuro",detail:"Una superficie tenue"}] as const).map(mode=>
        <label className="appearance-choice" key={mode.key}><input type="radio" name="appearance-mode" value={mode.key} checked={preference.mode===mode.key} onChange={()=>save({...preference,mode:mode.key})}/>
          <span className="appearance-symbol"><LineIcon kind="settings"/></span><span><strong>{mode.label}</strong><small>{mode.detail}</small></span></label>)}
    </div></fieldset>
    <fieldset disabled={saving} style={{ marginTop: 16 }}><legend>Color de botones y énfasis</legend><div className="appearance-options">
      {Object.entries(ACCENTS).map(([key, value]) => <label className="appearance-choice" key={key}>
        <input type="radio" name="appearance-accent" value={key} checked={preference.accent === key}
          onChange={() => save({ ...preference, accent: key as Appearance["accent"] })} /><span className="appearance-swatch" style={{background:value.light}} aria-hidden="true"/><strong>{value.label}</strong>
      </label>)}
    </div></fieldset>
    <button type="button" disabled={saving} className="btn secondary" onClick={() => save({ ...DEFAULT_APPEARANCE })}>Restablecer apariencia</button>
    <p className="muted">{syncEnabled ? "Tus preferencias se guardan en tu cuenta y se aplican al iniciar sesión en otro dispositivo." : userId ? "Preferencias separadas por cuenta en este navegador. Sincronización entre dispositivos pendiente de activación." : "Esta demostración guarda únicamente la apariencia de este navegador."}</p>
    <p role="status" aria-live="polite">{message}</p>
  </section></LocalizedContent>;
}

