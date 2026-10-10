"use client";

import { useState } from "react";
import {
  PILOT_STAGES, PILOT_SKILLS, decidePilot, initialPilot, pilotOptions, pilotScene, summarizePilot,
  type PilotMetrics, type PilotSkill
} from "../../../lib/assessment-decision-pilot";
import { copyForPilot } from "../../../lib/localization/assessment-pilot";

type SceneContent = {title:string;context:string;question:string;choices:Record<string,readonly [string,string]>};

export default function AssessmentDecisionPilot({locale}:{locale:string}){
  const t=copyForPilot(locale);
  const scenes=t.scenes as unknown as Record<string,SceneContent>;
  const [state,setState]=useState(initialPilot);
  const [choice,setChoice]=useState("");
  const [reason,setReason]=useState("");
  const [feedback,setFeedback]=useState<{scene:string;choice:string}|null>(null);
  const report=state.stage===PILOT_STAGES.length?summarizePilot(state):null;
  const scene=pilotScene(state);
  const current=scenes[scene];
  const options=pilotOptions(state);
  const metrics: (keyof PilotMetrics)[]=["adoption","trust","risk","days"];
  const move=()=>{
    if(!choice||reason.trim().length<40||reason.length>2500)return;
    try{
      const previous=scene;
      setState(decidePilot(state,choice,reason));
      setFeedback({scene:previous,choice});
      setChoice("");
      setReason("");
    }catch{return;}
  };
  const reset=()=>{setState(initialPilot());setChoice("");setReason("");setFeedback(null);};
  return <main className="wrap" style={{maxWidth:1050}}>
    <div className="nav">
      <div><span className="pill">{t.heading}</span><h1>{t.subtitle}</h1><p className="muted">{t.description}</p></div>
      <a className="btn secondary" href="/admin/curriculum">{t.back}</a>
    </div>
    <section className="card">
      <div className="grid grid2">
        {metrics.map(key=><div key={key} className="card" style={{margin:0}}>
          <p className="muted" style={{margin:0}}>{t.metric[key]}</p>
          <p style={{fontSize:"1.5rem",fontWeight:700,margin:"6px 0"}}>
            {state.metrics[key]}{key==="days"?"":"%"}
          </p>
        </div>)}
      </div>
      <p className="muted">{t.saved}</p>
    </section>
    {!report&&current&&<section className="card">
      <span className="pill">{t.stage} {state.stage+1} {t.of} {PILOT_STAGES.length} · {t.reference} {PILOT_STAGES[state.stage]}</span>
      <progress max={PILOT_STAGES.length} value={state.stage} aria-label={t.stage}/>
      <h2>{current.title}</h2>
      <p>{current.context}</p>
      {feedback?<div role="status" className="card">
        <h3>{t.consequence}</h3>
        <p>{scenes[feedback.scene].choices[feedback.choice][1]}</p>
        <button className="btn" type="button" onClick={()=>setFeedback(null)}>{t.continue}</button>
      </div>:<form onSubmit={e=>{e.preventDefault();move();}}>
        <fieldset><legend><b>{current.question}</b></legend>
          <p className="muted">{t.select}</p>
          {options.map(o=><label key={o.id} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"12px",marginBottom:8,border:"1px solid var(--vivo-border, #d0d6d2)",borderRadius:8}}>
            <input type="radio" name="decision" required checked={choice===o.id} onChange={()=>setChoice(o.id)}/>
            <span>{current.choices[o.id][0]}</span>
          </label>)}
        </fieldset>
        <label><b>{t.reason}</b>
          <textarea rows={5} maxLength={2500} minLength={40} required value={reason} onChange={e=>setReason(e.target.value)} placeholder={t.placeholder}/>
        </label>
        <button className="btn" type="submit" disabled={!choice||reason.trim().length<40}>{t.submit}</button>
      </form>}
    </section>}
    {report&&<section className="card">
      <h2>{t.outcome}</h2>
      <p className="muted">{t.warning}</p>
      <div className="grid grid2">
        <div className="card"><p>{t.decisionScore}</p><strong style={{fontSize:"2rem"}}>{report.percentage}%</strong></div>
        <div className="card"><p>{t.critical}</p><strong style={{fontSize:"2rem"}}>{report.criticalErrors}</strong></div>
      </div>
      <p role="status"><b>{report.decisionReady?t.decisionReady:t.needsRevision}</b></p>
      <h3>{t.skill}</h3>
      <div className="grid grid2">
        {PILOT_SKILLS.map(key=>{
          const entry=report.skills.find(x=>x.key===key);
          return <div key={key} className="card"><b>{t.skillNames[key]}</b>
            <p>{entry?.indicative===null?t.insufficient:String(entry?.indicative)+"/4 · "+t.provisional}</p>
            <p className="muted">{entry?.observations??0} {t.of} {PILOT_STAGES.length}</p>
          </div>;
        })}
      </div>
      <h3>{t.focus}</h3>
      {report.focus.length?<ol>{report.focus.map(key=><li key={key}>
        <b>{t.skillNames[key]}</b>: {t.reinforce[key as PilotSkill]}
      </li>)}</ol>:<p>{t.insufficient}</p>}
      <p className="muted">{t.noCredits}</p>
      <details><summary>{t.reasons}</summary><ol>
        {state.events.map((event,i)=><li key={i}><b>{scenes[event.scenario].choices[event.choice][0]}</b>
          <p style={{whiteSpace:"pre-wrap"}}>{event.rationale}</p><p className="muted">{scenes[event.scenario].choices[event.choice][1]}</p>
        </li>)}
      </ol></details>
      <button className="btn secondary" type="button" onClick={reset}>{t.restart}</button>
    </section>}
    <p className="muted">{t.readOnly}</p>
  </main>;
}
