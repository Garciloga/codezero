"use client";
import LocalizedContent from "./localization/client";

import {useState} from 'react';
import {EVIDENCE_LABELS,parsePracticeEvidence,type PracticeEvidence} from '../../lib/assessment-evidence';
const EMPTY:PracticeEvidence={explanation:'',test:'',expected:'',observed:'',failure:'',tools:''};
export default function PracticeEvidenceReview(){
 const [value,setValue]=useState<PracticeEvidence>(EMPTY);const [message,setMessage]=useState('');
 return <LocalizedContent><section id="evidence-review" className="card"><span className="pill">DEMUESTRA EL PROCESO</span><h2>La respuesta también necesita evidencia</h2><p>Explica decisiones, pruebas y límites. Este borrador solo permanece en esta página; no se envía ni califica.</p><form onSubmit={event=>{event.preventDefault();setMessage(parsePracticeEvidence(value)?'Borrador con todos los campos. Falta revisar su calidad y consistencia con la rúbrica; no se ha aprobado una evaluación.':'Completa cada campo con entre 10 y 1,500 caracteres.');}}>{Object.entries(EVIDENCE_LABELS).map(([key,label])=><label key={key} style={{display:'block',margin:'16px 0'}}>{label}<textarea required minLength={10} maxLength={1500} rows={3} value={value[key as keyof PracticeEvidence]} onChange={event=>{setValue(current=>({...current,[key]:event.target.value}));setMessage('');}} style={{display:'block',width:'100%',boxSizing:'border-box'}}/></label>)}<button className="btn" type="submit">Revisar campos del borrador</button><button className="btn secondary" type="button" style={{marginLeft:12}} onClick={()=>{setValue({...EMPTY});setMessage('Borrador borrado.');}}>Borrar borrador</button><p role="status">{message}</p></form><p className="muted">Las variantes y la revisión del proceso reducen respuestas copiadas, pero no pueden impedir que alguien consulte una IA externa. No se acusa ni penaliza a nadie automáticamente.</p></section></LocalizedContent>;
}

