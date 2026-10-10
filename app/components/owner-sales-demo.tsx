"use client";
import {useMemo,useState} from "react";
import CompetencyMap from "./enterprise/competency-map";
import {COMPETENCIES,competencyProfile,type CompetencyEvidence,type CompetencyKey} from "../../lib/competency-matrix";
import {ownerDemoCopy} from "../../lib/localization/owner-demo";

const demoPeople=[
 {id:"synthetic-1",name:"Ana · Dirección",role:"manager_team_lead",team:"Customer Success"},
 {id:"synthetic-2",name:"Luis · Gerencia CS",role:"manager_team_lead",team:"Customer Success"},
 {id:"synthetic-3",name:"Elena · Customer Success",role:"customer_success",team:"Customer Success"},
 {id:"synthetic-4",name:"Julián",role:"account_manager",team:"Customer Success"},
 {id:"synthetic-5",name:"Sofía · Onboarding",role:"onboarding",team:"Customer Success"},
 {id:"synthetic-6",name:"María · Supervisión",role:"manager_team_lead",team:"Soporte"},
 {id:"synthetic-7",name:"Diego · Tech Support",role:"tech_support_l2",team:"Soporte"},
 {id:"synthetic-8",name:"Paula · Customer Support",role:"customer_support",team:"Soporte"}
] as const;
const addDays=(d:Date,days:number)=>new Date(d.getTime()+days*86400000).toISOString();

function perfectEvidence(personId:string,date:Date):CompetencyEvidence[]{
 return (Object.keys(COMPETENCIES) as CompetencyKey[]).flatMap(key=>{
  const baseId="synthetic-"+personId+"-"+key;
  const common={user_id:personId,organization_id:"synthetic-demo-only",activity_key:"SIMULATED: "+key,
   competency_scores:{[key]:4},assistance:"independent" as const,critical_errors:[] as string[]};
  return [
   {...common,id:baseId+"-base",independent_key:baseId+"-base",kind:"deliverable" as const,review_source:"manager" as const,observed_at:addDays(date,-80)},
   {...common,id:baseId+"-capstone",independent_key:baseId+"-capstone",kind:"capstone" as const,review_source:"admin" as const,observed_at:addDays(date,-42)},
   {...common,id:baseId+"-reevaluation",independent_key:baseId+"-reevaluation",kind:"deliverable" as const,review_source:"manager" as const,observed_at:addDays(date,-1),reevaluation_of:baseId+"-base"}
  ];
 });
}
export function perfectSalesDemo(date:Date){
 return demoPeople.map(p=>{
  const evidence=perfectEvidence(p.id,date);
  return {user_id:p.id,display_name:p.name,job_title:p.name,position:p.role,
   teams:[{id:p.team==="Customer Success"?"cs":"support",name:p.team}],
   summary:competencyProfile(evidence,null,date),completedLevels:15,totalLevels:15,completedProjects:3,completedExams:15};
 });
}
export default function OwnerSalesDemo({locale}:{locale:string}){
 const t=ownerDemoCopy(locale);
 const [generation,setGeneration]=useState(0);
 const [view,setView]=useState<"map"|"org"|"courses">("map");
 const [generationAt,setGenerationAt]=useState<Date|null>(null);
 const rows=useMemo(()=>generation>0?perfectSalesDemo(generationAt??new Date()):[],[generation,generationAt]);
 const generate=()=>{setGeneration(n=>n+1);setGenerationAt(new Date());setView("map");};
 const reset=()=>{setGeneration(0);setGenerationAt(null);setView("map");};
 return <section className="card">
  <h2>{t.demoTitle}</h2><p>{t.demoIntro}</p><p className="muted">{t.noStorage}</p>
  <div className="public-actions" style={{display:"flex",flexWrap:"wrap",gap:10}}>
   <button type="button" className="btn" onClick={generate}>{generation>0?t.regenerate:t.generate}</button>
   {generation>0&&<button type="button" className="btn secondary" onClick={reset}>{t.resetDemo}</button>}
  </div>
  {generation===0?<p role="status" className="muted">{t.empty}</p>:<>
   <div role="status" className="card" style={{marginTop:18}}>
    <strong>{t.fictitious}</strong>
    <p>{t.captions}</p>
    <p className="muted"><time dateTime={generationAt?.toISOString()}>{generationAt?.toLocaleString(locale)}</time></p>
   </div>
   <div className="grid grid4">
    {[
     [t.employees,String(rows.length)],
     [t.complete,"120/120 · 100%"],
     [t.competencies,"4/4 · 100%"],
     [t.teams,"2"]
    ].map(([label,val])=><div className="card" key={label} style={{margin:0}}><p className="muted">{label}</p><strong style={{fontSize:"1.4rem"}}>{val}</strong></div>)}
   </div>
   <nav aria-label={t.demoTitle} className="public-actions" style={{display:"flex",flexWrap:"wrap",gap:10}}>
    {([["map",t.viewMap],["org",t.viewOrg],["courses",t.viewCourses]] as const).map(([key,label])=>
     <button key={key} type="button" className={view===key?"btn":"btn secondary"} aria-pressed={view===key} onClick={()=>setView(key)}>{label}</button>)}
   </nav>
   {view==="map"&&<div>
    <h3>{t.manager}</h3><p className="muted">{t.captions}</p>
    <CompetencyMap org="synthetic-demo-only" rows={rows} units={[]} readOnly/>
   </div>}
   {view==="org"&&<div className="card"><h3>{t.orgHead}</h3>
    <ul><li><b>{t.teamOne}</b><ul>{rows.filter(p=>p.teams[0].id==="cs").map(p=><li key={p.user_id}>{p.display_name}</li>)}</ul></li>
     <li><b>{t.teamTwo}</b><ul>{rows.filter(p=>p.teams[0].id==="support").map(p=><li key={p.user_id}>{p.display_name}</li>)}</ul></li></ul>
   </div>}
   {view==="courses"&&<div className="card"><h3>{t.viewCourses}</h3><p>{t.coursesIntro}</p>
    <div className="vivo-table-scroll"><table><thead><tr><th scope="col">{t.employees}</th><th scope="col">{t.complete}</th><th scope="col">{t.competencies}</th></tr></thead>
     <tbody>{rows.map(p=><tr key={p.user_id}><th scope="row">{p.display_name}</th><td>15 / 15 · 100%</td><td>10 / 10 · 4/4</td></tr>)}</tbody></table></div>
   </div>}
   <p role="note">{t.fictitious}</p>
  </>}
 </section>;
}
