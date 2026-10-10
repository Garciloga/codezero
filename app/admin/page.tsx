import LocalizedContent from "../components/localization/server";
import { redirect } from "next/navigation";
import { createServerSupabase } from "../../lib/supabase-server";
import {workspaceEnabled} from "../../lib/workspace-sandbox";
import { createAdminSupabase, requireAdmin } from "../../lib/admin";
import {roleTrainingEnabled} from '../../lib/role-training-policy';
import AdminUserList from '../components/admin-user-list';
import OwnerUserCreate from '../components/owner-user-create';

type PageProps = {
  searchParams: Promise<{ updated?: string; reviewed?: string; ticket?: string; support?: string }>;
};

export default async function Admin({ searchParams }: PageProps) {
  const { updated, reviewed, ticket, support } = await searchParams;

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let operatorRole="";
  try {
    operatorRole=(await requireAdmin(user.id)).role;
  } catch {
    redirect("/dashboard");
  }

  const admin = createAdminSupabase();

  const [
    { data: users },
    { count: userCount },
    { data: plans },
    { count: examAttempts },
    { count: projectSubmissions },
    { data: pendingProjects },
    { count: failedWebhookEvents },
    { data: webhookFailures },
    { data: auditLog },
    { count: openSupportTickets },
    { data: supportTickets },
    { data: supportSuggestions },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id,email,full_name,role,plan_name,status,billing_status,stripe_cancel_at_period_end,created_at")
      .neq("role", "owner").is("deleted_at",null)
      .order("created_at", { ascending: false })
      .limit(100),
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("plans").select("*").order("sort_order"),
    admin.from("exam_attempts").select("*", { count: "exact", head: true }),
    admin.from("project_submissions").select("*", { count: "exact", head: true }),
    admin
      .from("project_submissions")
      .select("id,user_id,project_id,submission_text,status,score,feedback,created_at")
      .in("status", ["submitted", "needs_revision"])
      .order("created_at", { ascending: false })
      .limit(25),
    admin
      .from("stripe_webhook_events")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed"),
    admin
      .from("stripe_webhook_events")
      .select("event_id,event_type,status,attempts,last_error,updated_at")
      .eq("status", "failed")
      .order("updated_at", { ascending: false })
      .limit(10),
    admin
      .from("admin_audit_log")
      .select("id,actor_user_id,action,target_type,target_id,metadata,created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("support_tickets")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "in_progress", "waiting_user"]),
    admin
      .from("support_tickets")
      .select("id,user_id,subject,category,priority,status,description,created_at,updated_at")
      .in("status", ["open", "in_progress", "waiting_user"])
      .order("created_at", { ascending: true })
      .limit(30),
    admin
      .from("support_suggestions")
      .select("id,user_id,title,category,status,detail,created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Completed lessons per listed user, split into server-verified and earlier (historical) ones.
  const lessonCounts: Record<string, { verified: number; historical: number }> = {};
  const listedIds = (users ?? []).map((u: any) => u.id);
  if (listedIds.length > 0) {
    const { data: lessonRows } = await admin
      .from("lesson_progress")
      .select("user_id, verified_at")
      .eq("status", "completed")
      .in("user_id", listedIds);
    for (const row of lessonRows ?? []) {
      const entry = (lessonCounts[row.user_id] ??= { verified: 0, historical: 0 });
      if (row.verified_at) entry.verified += 1; else entry.historical += 1;
    }
  }

  return (
    <LocalizedContent><main className="wrap admin-workspace">
      <div className="nav">
        <div>
          <span className="pill">Propietario y administración</span>
          <h1>Panel de control</h1>
          <p className="muted">Usuarios, planes, acceso y actividad académica.</p>
        </div>
        <a className="btn secondary" href="/dashboard">Mi cuenta</a>
      </div>
      <nav className="admin-links" aria-label="Secciones de administración">
        {operatorRole==='owner'&&<a className="btn" href="/admin/usage">Uso por persona</a>}
        {operatorRole==='owner'&&<a className="btn" href="/admin/curriculum">Inspeccionar todos los cursos</a>}
        {workspaceEnabled()&&<a className="btn" href="/admin/companies">Compañías, contratos e invitaciones</a>}
        <a className="btn secondary" href="/admin/social">Comunidad y mentorías</a>
        <a className="btn secondary" href="/admin/activation">Activación por cohortes</a>
        <a className="btn secondary" href="/customer-success/review">Revisar proyectos Customer Success</a>
        {roleTrainingEnabled()&&<a className="btn secondary" href="/role-training/review">Revisar proyectos por puesto</a>}
        {roleTrainingEnabled()&&operatorRole==='owner'&&<a className="btn secondary" href="/role-training/profiles">Perfiles de competencia</a>}
        {workspaceEnabled()&&<a className="btn secondary" href="/admin/metrics">Analítica de visitas</a>}
      </nav>

      {operatorRole === "owner" && <details className="card admin-create"><summary>Crear usuario</summary><OwnerUserCreate /></details>}
      {support&&<p role="alert">No pudimos abrir la revisión. La cuenta debe estar activa y tener el correo verificado. Si ya estás en una revisión, vuelve primero a tu cuenta.</p>}
      {updated === "1" && (
        <div className="card" style={{ marginBottom: 18 }}>
          <b>Usuario actualizado.</b>
        </div>
      )}

      {reviewed === "1" && (
        <div className="card" style={{ marginBottom: 18 }}>
          <b>Proyecto revisado.</b>
        </div>
      )}

      {ticket === "updated" && (
        <div className="card" style={{ marginBottom: 18 }}>
          <b>Ticket de soporte actualizado.</b>
        </div>
      )}

      <div className="grid grid4">
        <div className="card">
          <div className="muted">Usuarios</div>
          <div className="stat">{userCount ?? 0}</div>
        </div>
        <div className="card">
          <div className="muted">Activos</div>
          <div className="stat">{users?.filter((u) => u.status === "active").length ?? 0}</div>
        </div>
        <div className="card">
          <div className="muted">Intentos de examen</div>
          <div className="stat">{examAttempts ?? 0}</div>
        </div>
        <div className="card">
          <div className="muted">Tickets de soporte abiertos</div>
          <div className="stat">{openSupportTickets ?? 0}</div>
        </div>
      </div>

      {(failedWebhookEvents ?? 0) > 0 && (
        <div className="card" style={{ marginTop: 18 }}>
          <span className="pill">ATENCIÓN</span>
          <h2>Webhooks de Stripe con error: {failedWebhookEvents}</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {(webhookFailures ?? []).map((event) => (
              <div key={event.event_id} style={{ borderTop: "1px solid #e5e9f0", paddingTop: 10 }}>
                <b>{event.event_type}</b>
                <div className="muted">
                  {event.event_id} · intentos {event.attempts} · {event.updated_at}
                </div>
                {event.last_error && <div className="muted">{event.last_error}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <AdminUserList users={users??[]} plans={plans??[]} owner={operatorRole==='owner'} lessons={lessonCounts}/>

      <div className="card" style={{ marginTop: 18 }}>
        <span className="pill">GARCILOGA SUPPORT</span>
        <h2>Bandeja de soporte</h2>
        <p className="muted">Responde tickets, cambia prioridad y controla el estado desde el mismo panel.</p>

        {(supportTickets ?? []).length === 0 ? (
          <p className="muted">No hay tickets abiertos.</p>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {(supportTickets ?? []).map((supportTicket) => (
              <div key={supportTicket.id} style={{ borderTop: "1px solid #e5e9f0", paddingTop: 16 }}>
                <b>#{supportTicket.id} · <span translate="no">{supportTicket.subject}</span></b>
                <p className="muted">
                  Usuario {supportTicket.user_id} · {supportTicket.category} · {supportTicket.priority} · {supportTicket.status}
                </p>
                <p style={{ whiteSpace: "pre-wrap" }}>{supportTicket.description}</p>{operatorRole==='owner'&&<form action="/api/admin/users/become" method="post"><input type="hidden" name="user_id" value={supportTicket.user_id}/><button className="btn secondary">Ver como usuario</button></form>}
                <form action="/api/admin/support/tickets/update" method="post" style={{ display:"grid", gap:10, maxWidth:760 }}>
                  <input type="hidden" name="ticket_id" value={supportTicket.id} />
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    <select name="status" defaultValue={supportTicket.status} style={{padding:10,borderRadius:10,border:"1px solid #d8dee8"}}>
                      <option value="open">open</option>
                      <option value="in_progress">in_progress</option>
                      <option value="waiting_user">waiting_user</option>
                      <option value="resolved">resolved</option>
                      <option value="closed">closed</option>
                    </select>
                    <select name="priority" defaultValue={supportTicket.priority} style={{padding:10,borderRadius:10,border:"1px solid #d8dee8"}}>
                      <option value="low">low</option>
                      <option value="normal">normal</option>
                      <option value="high">high</option>
                      <option value="urgent">urgent</option>
                    </select>
                  </div>
                  <textarea name="reply" rows={4} maxLength={8000} placeholder="Respuesta opcional para el usuario" style={{padding:10,borderRadius:10,border:"1px solid #d8dee8"}} />
                  <button className="btn secondary" type="submit">Guardar / responder</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h2>Sugerencias recientes</h2>
        {(supportSuggestions ?? []).length === 0 ? (
          <p className="muted">Todavía no hay sugerencias.</p>
        ) : (
          <div style={{display:"grid",gap:12}}>
            {(supportSuggestions ?? []).map((suggestion) => (
              <div key={suggestion.id} style={{borderTop:"1px solid #e5e9f0",paddingTop:12}}>
                <b>{suggestion.title}</b>
                <div className="muted">{suggestion.category} · {suggestion.status} · usuario {suggestion.user_id}</div>
                <p style={{whiteSpace:"pre-wrap"}}>{suggestion.detail}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h2>Revisión de proyectos</h2>
        <p className="muted" style={{lineHeight:1.6}}>
          Guía sugerida de puntuación: problema y alcance 15 pts · arquitectura 20 ·
          implementación 25 · seguridad/resiliencia 15 · pruebas/observabilidad 15 ·
          documentación/demo 10. A partir de 70 puntos el proyecto queda aprobado.
        </p>

        {(pendingProjects ?? []).length === 0 ? (
          <p className="muted">No hay proyectos pendientes de revisión.</p>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {(pendingProjects ?? []).map((submission) => (
              <div key={submission.id} style={{ borderTop: "1px solid #e5e9f0", paddingTop: 16 }}>
                <p className="muted">
                  Usuario {submission.user_id} · Proyecto {submission.project_id} · Estado {submission.status}
                </p>
                <p style={{ whiteSpace: "pre-wrap" }}><span translate="no">{submission.submission_text}</span></p>

                <form
                  action="/api/admin/projects/review"
                  method="post"
                  style={{ display: "grid", gap: 10, maxWidth: 700 }}
                >
                  <input type="hidden" name="submission_id" value={submission.id} />
                  <input
                    type="number"
                    name="score"
                    min="0"
                    max="100"
                    defaultValue={submission.score ?? 70}
                    required
                    style={{ padding: 10, borderRadius: 10, border: "1px solid #d8dee8" }}
                  />
                  <textarea
                    name="feedback"
                    defaultValue={submission.feedback ?? ""}
                    rows={4}
                    placeholder="Feedback para el alumno"
                    style={{ padding: 10, borderRadius: 10, border: "1px solid #d8dee8", font: "inherit" }}
                  />
                  <button className="btn secondary" type="submit">Guardar revisión</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h2>Auditoría administrativa</h2>
        {(auditLog ?? []).length === 0 ? (
          <p className="muted">Todavía no hay acciones administrativas registradas.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {(auditLog ?? []).map((entry) => (
              <div key={entry.id} style={{ borderTop: "1px solid #e5e9f0", paddingTop: 10 }}>
                <b>{entry.action}</b>
                <div className="muted">
                  {entry.target_type} {entry.target_id ?? "—"} · {entry.created_at}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h2>Planes</h2>
        <div className="grid grid2">
          {(plans ?? []).map((plan) => (
            <div key={plan.id}>
              <b><span translate="no">{plan.name}</span></b>
              <p className="muted">
                {"$" + (plan.price_monthly_cents / 100).toFixed(0)} MXN/mes ·
                ejercicios {plan.exercise_limit < 0 ? "sin límite" : plan.exercise_limit} ·
                exámenes {plan.exam_limit < 0 ? "sin límite" : plan.exam_limit} ·
                IA {plan.ai_query_limit < 0 ? "sin límite" : plan.ai_query_limit} ·
                proyectos {plan.project_limit < 0 ? "sin límite" : plan.project_limit}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main></LocalizedContent>
  );
}




