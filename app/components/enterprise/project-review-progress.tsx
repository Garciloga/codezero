import LocalizedContent from '../localization/server';
import type {ReviewRun,ReviewVote} from '../../../lib/project-review-flow';
export default function ProjectReviewProgress({runs,votes=[]}:{runs:ReviewRun[];votes?:ReviewVote[]}){
 if(!runs.length)return null;
 return <LocalizedContent><section className="card"><h2>Aprobación de mis proyectos</h2>{runs.map(run=><article key={run.submission_id}><h3>Entrega {run.submission_id}</h3><p>{run.state==='approved'?'Aprobación completa':run.state==='changes_requested'?'Cambios solicitados':'En revisión'}</p><ol>{run.snapshot.map((s,i)=><li key={i}>{s.name} · {run.progress[String(i)]?.approved??0}/{s.required} aprobaciones · {run.state==='approved'||i<run.current_stage?'completado':i===run.current_stage?'paso actual':'en espera'}<p>Revisores: {s.reviewers.map(r=>r.name||r.id).join(', ')}</p>{votes.filter(v=>v.submission_id===run.submission_id&&v.stage_index===i).map(v=><p key={v.id}>{v.observed_at.slice(0,10)} · {s.reviewers.find(r=>r.id===v.user_id)?.name??v.user_id} · {v.decision==='approve'?'Aprobó':'Solicitó cambios'}: {v.feedback}</p>)}</li>)}</ol></article>)}</section></LocalizedContent>;
}
