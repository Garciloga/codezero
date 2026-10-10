type Decision={
 id:string;level_number:number;unit_number:number;phase_number:number;
 option_key:string;reasoning:string;evidence_reference:string;revision:number
};
export default function DraftDecisionReview({decisions}:{decisions:Decision[]}){
 if(!decisions.length)return null;
 return <section className="card" aria-label="Revisión de decisiones de cursos en borrador">
 <span className="pill">Sandbox · sin progreso productivo</span>
 <h2>Revisión de decisiones pendientes</h2>
 <p>Estas simulaciones no certifican habilidades ni modifican el progreso publicado. Solo responsables autorizados pueden revisar una entrega y registrar evidencia.</p>
 {decisions.map(d=><article key={d.id} className="card">
   <h3>Nivel {d.level_number} · Unidad {d.unit_number} · Fase {d.phase_number}</h3>
   <p>Opción razonada: {d.option_key.toUpperCase()} · Revisión {d.revision}</p>
   <p>{d.reasoning}</p><p>Referencia aportada: <span translate="no">{d.evidence_reference}</span></p>
   <form action="/api/teams/course-decision-review" method="post">
    <input type="hidden" name="decision_id" value={d.id}/>
    {(["accuracy","analysis","decisions","privacy","evidence"] as const).map((k)=>
     <label key={k}>{({accuracy:"Precisión",analysis:"Análisis",decisions:"Decisiones",privacy:"Privacidad",evidence:"Evidencia"} as Record<string,string>)[k]} (0–4)
     <input name={"score_"+k} type="number" min="0" max="4" step="1" defaultValue="3" required/></label>)}
    <label>Observaciones y justificación<textarea name="feedback" minLength={40} maxLength={3000} required rows={4}/></label>
    <label><input type="checkbox" name="critical_error"/> Error crítico sin resolver</label>
    <button className="btn">Registrar revisión humana</button>
    <p>La aprobación depende de cinco puntuaciones, cero errores críticos y un umbral progresivo. No es un acto automático de evaluación laboral.</p>
   </form>
 </article>)}
 </section>;
}
