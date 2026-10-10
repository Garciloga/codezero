"use client";

import {useState} from "react";
import {ADVANCED_OPTION_IDS,type AdvancedSceneKey} from "../../lib/advanced-assessment-public";
import {advancedCopyFor,advancedScenarioText} from "../../lib/localization/advanced-assessment";
import type {AdvancedInput,AdvancedMetrics} from "../../lib/advanced-assessment";
type ResponseState={step:number;scene:string;metrics:AdvancedMetrics;complete:boolean;
 summary?:{objective:number;critical:number;readyForHumanReview:boolean;signals:Record<string,{count:number;indicative:number|null}>};
 recommendations?:string[]};
const start:ResponseState={step:0,scene:"intake",complete:false,metrics:{trust:44,adoption:42,risk:68,budget:12000,days:45}};
const metrics:["trust","adoption","risk","budget","days"]=["trust","adoption","risk","budget","days"];

export default function AdvancedAssessmentPlayer({locale,org,canSave}:{locale:string;org:string|null;canSave:boolean}){
 const t=advancedCopyFor(locale);
 const [progress,setProgress]=useState<ResponseState>(start);
 const [history,setHistory]=useState<AdvancedInput[]>([]);
 const [choice,setChoice]=useState("");
 const [facts,setFacts]=useState("");
 const [tradeoff,setTradeoff]=useState("");
 const [verification,setVerification]=useState("");
 const [feedback,setFeedback]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [saved,setSaved]=useState(false);
 const [attemptId,setAttemptId]=useState<string|null>(null);
 const scene=progress.scene as AdvancedSceneKey;
 const text=progress.complete?null:advancedScenarioText(locale,scene);
 const available=ADVANCED_OPTION_IDS[scene]??[];
 const acceptable=Boolean(choice&&[facts,tradeoff,verification].every(x=>x.trim().length>=50&&x.length<=650));
 const advance=async()=>{
  if(!acceptable||busy||progress.complete)return;
  const answers=[...history,{choice,facts,tradeoff,verification}];
  setBusy(true);setError("");
  try{
   const res=await fetch("/api/decisions/step",{method:"POST",cache:"no-store",
    headers:{"Content-Type":"application/json"},body:JSON.stringify({organization_id:org,inputs:answers})});
   const payload=await res.json();
   if(!res.ok||!Number.isInteger(payload.step)||payload.step!==answers.length)throw Error("INVALID_STEP");
   setHistory(answers);setProgress(payload);setFeedback(true);
   setChoice("");setFacts("");setTradeoff("");setVerification("");
  }catch{setError(t.error);}finally{setBusy(false);}
 };
 const save=async()=>{
  if(!canSave||!progress.complete||busy||saved)return;
  setBusy(true);setError("");
  const id=attemptId??crypto.randomUUID();
  setAttemptId(id);
  try{
   const res=await fetch("/api/decisions/submit",{method:"POST",cache:"no-store",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({organization_id:org,request_id:id,inputs:history})});
   const payload=await res.json();
   if(!res.ok||!payload.saved)throw Error("SAVE_FAILED");
   setSaved(true);
  }catch{setError(t.error);}finally{setBusy(false);}
 };
 const reset=()=>{setHistory([]);setProgress(start);setChoice("");setFacts("");setTradeoff("");setVerification("");setFeedback(false);setSaved(false);setAttemptId(null);setError("");};
 return <main className="wrap" style={{maxWidth:1050}}>
  <div className="nav"><div><span className="pill">{t.heading}</span><h1>{t.intro}</h1></div>
   <a className="btn secondary" href={canSave?"/role-training":"/admin/curriculum"}>{t.back}</a></div>
  <section className="card">
   <div className="grid grid2">
    {metrics.map(key=><div className="card" key={key} style={{margin:0}}>
     <p className="muted" style={{margin:0}}>{t.metric[key]}</p>
     <strong style={{fontSize:"1.35rem"}}>{progress.metrics[key]}{key==="trust"||key==="risk"||key==="adoption"?"%":""}</strong>
    </div>)}
   </div>
   <p className="muted">{t.privacy}</p>
  </section>
  {!progress.complete&&text&&<section className="card">
   <span className="pill">{t.stage} {progress.step+1} {t.of} 8 · {t.level} {[1,3,5,7,9,11,13,15][progress.step]}</span>
   <progress max={8} value={progress.step} aria-label={t.stage}/>
   <h2>{text.title}</h2><p>{text.context}</p>
   {feedback?<div role="status" className="card">
    <h3>{t.sceneConsequence}</h3>
    <p>{metrics.map(k=>t.metric[k]+": "+progress.metrics[k]).join(" · ")}</p>
    <button className="btn" type="button" onClick={()=>setFeedback(false)}>{t.move}</button>
   </div>:<form onSubmit={e=>{e.preventDefault();void advance();}}>
    <fieldset><legend><b>{t.choices}</b></legend>
     {available.map((id,i)=><label key={id} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"12px",marginBottom:8,border:"1px solid var(--vivo-border, #cbd5cf)",borderRadius:8}}>
      <input name="option" type="radio" checked={choice===id} onChange={()=>setChoice(id)} required/>
      <span>{text.choices[i]}</span>
     </label>)}
    </fieldset>
    <label><b>{t.facts}</b><textarea value={facts} onChange={e=>setFacts(e.target.value)} minLength={50} maxLength={650} rows={4} required/></label>
    <label><b>{t.tradeoff}</b><textarea value={tradeoff} onChange={e=>setTradeoff(e.target.value)} minLength={50} maxLength={650} rows={4} required/></label>
    <label><b>{t.verification}</b><textarea value={verification} onChange={e=>setVerification(e.target.value)} minLength={50} maxLength={650} rows={4} required/></label>
    <button className="btn" type="submit" disabled={!acceptable||busy}>{t.next}</button>
   </form>}
  </section>}
  {progress.complete&&<section className="card">
   <h2>{t.result}</h2>
   {feedback&&<p role="status">{t.sceneConsequence} {metrics.map(k=>t.metric[k]+": "+progress.metrics[k]).join(" · ")}</p>}
   <div className="grid grid2">
    <div className="card"><p>{t.result}</p><strong style={{fontSize:"2rem"}}>{progress.summary?.objective??0}/100</strong></div>
    <div className="card"><p>{t.review}</p><strong>{progress.summary?.critical??0} {t.critical}</strong></div>
   </div>
   <p className="muted">{t.notice}</p>
   <h3>{t.focus}</h3>
   {(progress.recommendations??[]).length>0?<ul>{(progress.recommendations??[]).map(k=><li key={k}>{t.skills[k as keyof typeof t.skills]}</li>)}</ul>:<p>{t.review}</p>}
   {canSave?<><button className="btn" onClick={()=>void save()} disabled={busy||saved}>{saved?t.saved:t.submit}</button>
    {saved&&<p role="status">{t.saved} · {t.review}</p>}</>:<p className="muted">{t.optional} · {t.more}</p>}
   <button className="btn secondary" onClick={reset} type="button" style={{marginLeft:10}}>{t.restart}</button>
  </section>}
  {error&&<p role="alert" className="card">{error}</p>}
 </main>;
}
