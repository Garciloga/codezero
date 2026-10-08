"use client";
import LineIcon from "./line-icon";
import LocalizedContent from "./localization/client";

import { useEffect, useState } from "react";
import { ACCENTS, withAccent, PALETTE_FIELDS, paletteFor, paletteWarnings, DEFAULT_APPEARANCE, appearanceStorageKey, parseAppearance, type Appearance } from "../../lib/user-appearance";
import { APPEARANCE_EVENT } from "./appearance-provider";
export default function AppearanceSettings({ userId, initialPreference, syncEnabled=false }: { userId: string | null; initialPreference?: unknown; syncEnabled?: boolean }) {
  const [preference, setPreference] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [message, setMessage] = useState("");
  const [paletteMode, setPaletteMode] = useState<"light"|"dark">("light");
  const [draft, setDraft] = useState<Appearance | null>(null);
  useEffect(() => () => {window.dispatchEvent(new CustomEvent(APPEARANCE_EVENT,{detail:{userId,preference:null}}));}, [userId]);
  function preview(next: Appearance) {
    setDraft(next);
    window.dispatchEvent(new CustomEvent(APPEARANCE_EVENT,{detail:{userId,preference:next}}));
  }
  const editing = draft ?? preference;
  const palette = paletteFor(editing,paletteMode);
  const warnings = paletteWarnings(editing,paletteMode);
  useEffect(() => {
    try { const next=parseAppearance(initialPreference ?? JSON.parse(localStorage.getItem(appearanceStorageKey(userId)) ?? "null"));setPreference(next);setPaletteMode(next.mode === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : next.mode); }
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
      setDraft(null);
      window.dispatchEvent(new CustomEvent(APPEARANCE_EVENT,{detail:{userId,preference:next}}));
      setMessage(syncEnabled ? "Apariencia sincronizada para tu cuenta." : userId ? "Apariencia guardada para tu cuenta en este navegador." : "Apariencia guardada en este navegador.");
    } catch {
      if (syncEnabled) {
        setPreference(next);
      setDraft(null);
        window.dispatchEvent(new CustomEvent(APPEARANCE_EVENT,{detail:{userId,preference:next}}));
      }
      setMessage(syncEnabled ? "Guardado en tu cuenta; este navegador no permite conservar la copia local." : "Este navegador no permite guardar preferencias. No se modificaron tus ajustes.");
    }
    setSaving(false);
  }
  return <LocalizedContent><section className="card appearance-settings" style={{ marginTop: 18 }} aria-labelledby="appearance-heading" aria-busy={saving}>
    <span className="pill">A TU MANERA</span><h2 id="appearance-heading">Personaliza Garciloga</h2>
    <p className="muted">Elige modo claro, oscuro o automático y personaliza los colores de la plataforma.</p>
    <fieldset disabled={saving}><legend>Modo de pantalla</legend><div className="appearance-options">
      {([{key:"system",label:"Dispositivo",detail:"Sigue tu preferencia del sistema"},{key:"light",label:"Claro",detail:"Una superficie luminosa"},{key:"dark",label:"Oscuro",detail:"Una superficie tenue"}] as const).map(mode=>
        <label className="appearance-choice" key={mode.key}><input type="radio" name="appearance-mode" value={mode.key} checked={editing.mode===mode.key} onChange={()=>draft ? preview({...draft,mode:mode.key}) : save({...preference,mode:mode.key})}/>
          <span className="appearance-symbol"><LineIcon kind="settings"/></span><span><strong>{mode.label}</strong><small>{mode.detail}</small></span></label>)}
    </div></fieldset>
    <fieldset disabled={saving} style={{ marginTop: 16 }}><legend>Color de botones y énfasis</legend><div className="appearance-options">
      {Object.entries(ACCENTS).map(([key, value]) => <label className="appearance-choice" key={key}>
        <input type="radio" name="appearance-accent" value={key} checked={editing.accent === key}
          onChange={() => draft ? preview(withAccent(draft,key as Appearance["accent"])) : save(withAccent(preference,key as Appearance["accent"]))} /><span className="appearance-swatch" style={{background:value.light}} aria-hidden="true"/><strong>{value.label}</strong>
      </label>)}
    </div></fieldset>
    <details className="appearance-palette" style={{marginTop:20}}>
      <summary>Todos los colores</summary>
      <p className="muted">Configura una paleta para modo claro y otra para oscuro. Los cambios se muestran como vista previa; pulsa Guardar colores para conservarlos.</p>
      <label htmlFor="palette-mode">Paleta que quieres editar</label>
      <select id="palette-mode" value={paletteMode} onChange={e=>{const mode=e.target.value as "light"|"dark";setPaletteMode(mode);preview({...editing,mode});}}><option value="light">Claro</option><option value="dark">Oscuro</option></select>
      <fieldset disabled={saving}><legend>Colores de la plataforma</legend><div className="palette-grid">
        {Object.entries(PALETTE_FIELDS).map(([key,field])=><label key={key}>
          <span>{field.label}</span><input type="color" aria-label={field.label} value={palette[key as keyof typeof palette]}
            onChange={e=>preview({...editing,colors:{...editing.colors,[paletteMode]:{...editing.colors?.[paletteMode],[key]:e.target.value}}})}/>
          <code>{palette[key as keyof typeof palette]}</code>
        </label>)}
      </div></fieldset>
      {warnings.length>0 && <p role="status">Contraste bajo en: {warnings.join("; ")}. Puedes ajustar estos colores para facilitar la lectura.</p>}
      <div className="appearance-options">
        <button type="button" className="btn" disabled={saving || !draft} onClick={()=>save(editing)}>Guardar colores</button>
        <button type="button" className="btn secondary" disabled={saving || !draft} onClick={()=>{setDraft(null);window.dispatchEvent(new CustomEvent(APPEARANCE_EVENT,{detail:{userId,preference}}));}}>Descartar cambios</button>
      </div>
    </details>
    <button type="button" disabled={saving} className="btn secondary" onClick={() => save({ ...DEFAULT_APPEARANCE })}>Restablecer apariencia</button>
    <p className="muted">{syncEnabled ? "Tus preferencias se guardan en tu cuenta y se aplican al iniciar sesión en otro dispositivo." : userId ? "Preferencias separadas por cuenta en este navegador. Sincronización entre dispositivos pendiente de activación." : "Esta demostración guarda únicamente la apariencia de este navegador."}</p>
    <p role="status" aria-live="polite">{message}</p>
  </section></LocalizedContent>;
}

