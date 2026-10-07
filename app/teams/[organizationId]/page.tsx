import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { workspaceUser } from "../../../lib/workspace-server";
import { workspaceEnabled, isUuid } from "../../../lib/workspace-sandbox";
import { assignedProgress } from "../../../lib/enterprise-learning";
import { readWorkspacePages } from "../../../lib/workspace-pages";
export const metadata = {title:"Organigrama y avance",robots:{index:false,follow:false}};
const ROLE_LABELS: Record<string,string> = {owner:"Dirección",admin:"Administrador",manager:"Manager",supervisor:"Supervisor",learner:"Colaborador"};
type Member = {user_id:string;display_name:string;role:string;reports_to:string|null;active:boolean};
type Assignment = {user_id:string;activity_key:string;title:string;competency:string};
type Evidence = {user_id:string;activity_key:string;completed:boolean;score:number|null;observed_at:string};
function Hidden({action,organizationId}:{action:string;organizationId:string}) {
  return <><input type="hidden" name="action" value={action}/><input type="hidden" name="organization_id" value={organizationId}/></>;
}
function RoleSelect({includeOwner=false,defaultValue="learner"}:{includeOwner?:boolean;defaultValue?:string}) {
  return <select name="role" defaultValue={defaultValue} aria-label="Rol en la organización">{Object.entries(ROLE_LABELS).filter(([key])=>key!=="owner"||includeOwner).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>;
}
function ManagerSelect({members,current,exclude}:{members:Member[];current?:string|null;exclude?:string}) {
  return <select name="reports_to" defaultValue={current??""} aria-label="Reporta a"><option value="">Sin jefe directo</option>{members.filter(m=>m.active&&m.role!=="learner"&&m.user_id!==exclude).map(m=><option key={m.user_id} value={m.user_id}>{m.display_name}</option>)}</select>;
}
export default async function TeamPage({params,searchParams}:{params:Promise<{organizationId:string}>;searchParams:Promise<{result?:string}>}) {
  if (!workspaceEnabled()) notFound();
  const {organizationId:org} = await params;
  if (!isUuid(org)) notFound();
  const context = await workspaceUser();
  if (!context) redirect("/login");
  const {data:organization,error:orgError} = await context.supabase.from("organizations").select("name").eq("id",org).single();
  if (orgError || !organization) notFound();
  // Every data set is read with the learner's session and database RLS.
  const [roster,assignments,evidence,errors,invitations] = await Promise.all([
    readWorkspacePages<Member>((start,end)=>context.supabase.from("organization_memberships").select("user_id,display_name,role,reports_to,active").eq("organization_id",org).order("user_id").range(start,end)),
    readWorkspacePages<Assignment>((start,end)=>context.supabase.from("learning_assignments").select("user_id,activity_key,title,competency").eq("organization_id",org).order("user_id").order("activity_key").range(start,end)),
    readWorkspacePages<Evidence>((start,end)=>context.supabase.from("learning_evidence").select("user_id,activity_key,completed,score,observed_at").eq("organization_id",org).order("user_id").order("activity_key").range(start,end)),
    context.supabase.from("learning_errors").select("user_id,category,occurred_at").eq("organization_id",org).order("occurred_at",{ascending:false}).limit(50),
    context.supabase.from("organization_invitations").select("id,email,role,expires_at,accepted_at").eq("organization_id",org).is("accepted_at",null).order("expires_at",{ascending:false}).limit(50),
  ]);
  if ([roster,assignments,evidence,errors,invitations].some(r=>r.error)) return <main className="wrap"><h1>No pudimos cargar el equipo</h1><p>Intenta nuevamente. No se muestran métricas incompletas.</p></main>;
  const members = (roster.data??[]) as Member[];
  const own = members.find(m=>m.user_id===context.user.id&&m.active);
  if (!own) notFound();
  const manage = ["owner","admin"].includes(own.role);
  const catalog = manage ? await Promise.all(["lessons", "level_exams", "level_projects"].map(table =>
    readWorkspacePages<{id:number;title:string}>((start,end)=>context.supabase.from(table).select("id,title").eq("status","published").order("id").range(start,end))
  )) : [];
  const catalogReady = manage && catalog.every(result => !result.error);
  const activityTypes = [{key:"lesson",label:"Lección"},{key:"exam",label:"Evaluación"},{key:"project",label:"Proyecto"}];
  const result = (await searchParams).result;
  const messages:Record<string,string> = {saved:"Cambios guardados.",failed:"No se pudo completar el cambio. Revisa permisos, roles y jefaturas.",invitation_pending:"Invitación preparada. Comparte el enlace con la persona; debe iniciar sesión con el correo invitado.",mail_failed:"Invitación preparada; no se pudo solicitar el correo de prueba. La cuenta existente puede abrir el enlace e iniciar sesión.",mail_requested:"Correo solicitado al servicio Auth local. Comprueba su llegada en el buzón de pruebas."};
  return <main className="wrap"><Link href="/teams">Mis equipos</Link><h1>{organization.name}</h1>
    <p className="muted">Vista de {ROLE_LABELS[own.role]}. Solo se muestran personas y registros dentro de tu alcance.</p>
    {result && messages[result] && <p role="status">{messages[result]}</p>}
    <section className="card"><h2>Organigrama</h2><ul>{members.map(member=><li key={member.user_id}><details><summary>{member.display_name} · {ROLE_LABELS[member.role]}{!member.active&&" · Suspendido"}</summary><p>Reporta a: {member.reports_to ? members.find(m=>m.user_id===member.reports_to)?.display_name??"Jefatura fuera de tu alcance" : "Sin jefe directo"}</p><p>Reportes directos visibles: {members.filter(m=>m.reports_to===member.user_id).map(m=>m.display_name).join(", ")||"Ninguno"}</p>
      {manage && (own.role==="owner"||member.role!=="owner") && <form action="/api/teams/manage" method="post"><Hidden action="member" organizationId={org}/><input type="hidden" name="user_id" value={member.user_id}/><RoleSelect defaultValue={member.role} includeOwner={own.role==="owner"}/>{" "}<ManagerSelect members={members} current={member.reports_to} exclude={member.user_id}/>{" "}<label><input type="checkbox" name="active" value="1" defaultChecked={member.active}/> Acceso activo</label>{" "}<button className="btn secondary" type="submit">Guardar rol y jefe</button></form>}
    </details></li>)}</ul></section>
    <section className="card" style={{marginTop:18}}><h2>Avance y evidencias de competencias</h2><p><a className="btn secondary" href={`/api/teams/${org}/report`}>Descargar reporte CSV de mi alcance</a></p><form action="/api/teams/manage" method="post"><Hidden action="refresh" organizationId={org}/><button className="btn secondary" type="submit">Actualizar desde el aprendizaje registrado</button></form>
      <p className="muted">Se cuenta cada actividad asignada una vez. Los resultados proceden de lecciones, evaluaciones y proyectos; la afinidad vocacional no determina competencias.</p>
      {members.map(member=>{
        const assigned = (assignments.data??[]).filter(a=>a.user_id===member.user_id);
        const completed = (evidence.data??[]).filter(e=>e.user_id===member.user_id&&e.completed).map(e=>e.activity_key);
        const progress = assignedProgress(assigned.map(a=>a.activity_key),completed);
        const skills = [...new Set(assigned.map(a=>String(a.competency)))];
        return <article key={member.user_id} style={{marginTop:24}}><h3>{member.display_name}</h3>{!member.active ? <p>Acceso suspendido.</p> : progress ? <><p>{progress.completed}/{progress.total} actividades completadas · {progress.percent}%</p><progress aria-label={`Avance de ${member.display_name}`} value={progress.completed} max={progress.total} style={{width:"100%",accentColor:"var(--user-accent)"}}/><ul>{skills.map(skill=><li key={skill}>{skill}: {assigned.filter(a=>a.competency===skill&&completed.includes(a.activity_key)).length}/{assigned.filter(a=>a.competency===skill).length} actividades con requisito cumplido</li>)}</ul></> : <p>Sin actividades asignadas; aún no hay evidencia.</p>}</article>;
      })}
    </section>
    <section className="card" style={{marginTop:18}}><h2>Errores para reforzar el aprendizaje</h2><p className="muted">Últimos 50 registros visibles; categorías de aprendizaje, sin respuestas completas ni inferencias de fraude.</p>{errors.data?.length ? <ul>{errors.data.map((error,index)=><li key={index}>{members.find(m=>m.user_id===error.user_id)?.display_name??"Colaborador"}: {error.category==="exam_not_passed"?"Evaluación por reforzar":"Proyecto necesita revisión"} · {new Date(error.occurred_at).toLocaleDateString("es-MX",{timeZone:"America/Mexico_City"})}</li>)}</ul> : <p>Sin errores registrados dentro de tu alcance.</p>}</section>
    {manage && <>
      <section className="card" style={{marginTop:18}}><h2>Invitar a una cuenta</h2><p>La persona debe registrarse y confirmar el correo invitado. Comparte el enlace de incorporación; cada persona conserva su contraseña privada.</p><form action="/api/teams/manage" method="post"><Hidden action="invite" organizationId={org}/><label>Correo <input type="email" name="email" required maxLength={200}/></label>{" "}<RoleSelect/>{" "}<ManagerSelect members={members}/>{" "}<button className="btn" type="submit">Preparar invitación</button></form>
        <ul>{invitations.data?.map(invite=><li key={invite.id}>{invite.email} · {ROLE_LABELS[invite.role]} · vence {new Date(invite.expires_at).toLocaleDateString("es-MX",{timeZone:"America/Mexico_City"})}{" "}<Link href={`/teams/join?id=${invite.id}`}>Abrir incorporación</Link></li>)}</ul>
      </section>
      <section className="card" style={{marginTop:18}}><h2>Asignar actividad publicada</h2><form action="/api/teams/manage" method="post"><Hidden action="assign" organizationId={org}/><label>Colaborador <select name="user_id">{members.filter(m=>m.active).map(m=><option key={m.user_id} value={m.user_id}>{m.display_name}</option>)}</select></label>{" "}{catalogReady ? <label>Actividad publicada <select name="activity_key" required defaultValue=""><option value="" disabled>Elige una actividad</option>{activityTypes.map((type,index)=><optgroup key={type.key} label={type.label}>{catalog[index].data?.map(activity=><option key={activity.id} value={`${type.key}:${activity.id}`}>{activity.title} · {type.label}</option>)}</optgroup>)}</select></label> : <p>No pudimos cargar el catálogo; recarga antes de asignar.</p>}{" "}<label>Competencia a practicar <input name="competency" maxLength={80} required/></label>{" "}<button className="btn" type="submit" disabled={!catalogReady}>Asignar actividad</button></form><p className="muted">Asignar una actividad no cambia el plan ni desbloquea contenido fuera de sus derechos actuales.</p></section>
    </>}
  </main>;
}
