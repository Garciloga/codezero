"use client";
import { useState } from "react";
import { assignedProgress, canViewEmployeeLearning, type OrganizationMember } from "../../../lib/enterprise-learning";
const roster: (OrganizationMember & {name:string; completed:string[]; skill:string; errors:number})[] = [
  {organizationId:"demo",userId:"owner",role:"owner",reportsTo:null,active:true,name:"Dirección",completed:["handoff","adoption"],skill:"Gestión de cuentas",errors:0},
  {organizationId:"demo",userId:"manager",role:"manager",reportsTo:"owner",active:true,name:"Manager de Customer Success",completed:["handoff","adoption"],skill:"Gestión de cuentas",errors:1},
  {organizationId:"demo",userId:"supervisor",role:"supervisor",reportsTo:"manager",active:true,name:"Supervisión de onboarding",completed:["handoff"],skill:"Diagnóstico inicial",errors:2},
  {organizationId:"demo",userId:"employee",role:"learner",reportsTo:"supervisor",active:true,name:"Colaborador de onboarding",completed:["handoff"],skill:"Diagnóstico inicial",errors:3},
  {organizationId:"demo",userId:"peer",role:"learner",reportsTo:"owner",active:true,name:"Colaborador de otra área",completed:[],skill:"Sin evidencia",errors:0},
];
export default function EnterpriseLab() {
  const [viewer,setViewer] = useState("manager");
  const visible = roster.filter(member => canViewEmployeeLearning("demo",viewer,member.userId,roster));
  return <main className="wrap">
    <h1>Enterprise · revisión del organigrama</h1>
    <p className="muted">Datos ficticios. Este selector simula permisos para revisión; no cambia tu rol real ni conecta empleados. Activación de invitaciones, datos y RLS pendiente de autorización.</p>
    <section className="card"><h2>Jerarquía propuesta</h2><ul><li>Dirección<ul><li>Manager de Customer Success<ul><li>Supervisión de onboarding<ul><li>Colaborador de onboarding</li></ul></li></ul></li><li>Colaborador de otra área</li></ul></li></ul></section>
    <section className="card" style={{marginTop:16}}><h2>Vista por responsabilidad</h2>
      <label htmlFor="demo-viewer">Simular vista de </label><select id="demo-viewer" value={viewer} onChange={event=>setViewer(event.target.value)}>{roster.map(member=><option key={member.userId} value={member.userId}>{member.name}</option>)}</select>
      <p>Managers: descendientes. Supervisores: reportes directos. Colaboradores: su propio avance.</p>
      {visible.map(member=>{
        const progress = assignedProgress(["handoff","adoption"],member.completed)!;
        return <article key={member.userId} style={{marginTop:24}}><h3>{member.name}</h3>
          <p>Avance de actividades asignadas: {progress.completed}/{progress.total} · {progress.percent}%</p>
          <progress value={progress.completed} max={progress.total} aria-label={`Avance de ${member.name}`} style={{width:"100%",accentColor:"var(--user-accent)"}} />
          <p>Competencia con evidencia: {member.skill}. Errores de práctica: {member.errors}.</p>
        </article>;
      })}
      <p className="muted">Las métricas de esta maqueta son ficticias. Las competencias reales requerirán rúbricas y evidencia por actividad; los errores serán oportunidades de refuerzo, sin inferir uso de IA.</p>
    </section>
  </main>;
}
