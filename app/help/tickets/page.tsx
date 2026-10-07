import LocalizedContent from "../../components/localization/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "../../../lib/supabase-server";

type PageProps = { searchParams: Promise<{ created?: string; q?: string }> };

export default async function TicketsPage({ searchParams }: PageProps) {
  const { created, q = "" } = await searchParams;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("id,subject,category,priority,status,created_at,updated_at")
    .eq("user_id",user.id)
    .order("created_at",{ascending:false})
    .limit(50);

  return (
    <LocalizedContent><main className="wrap">
      <div className="nav">
        <div>
          <span className="pill">TICKETS</span>
          <h1>Mis casos de soporte</h1>
          <p className="muted">Abre un ticket si el Centro de ayuda no resolvió tu problema.</p>
        </div>
        <Link className="btn secondary" href="/help">Centro de ayuda</Link>
      </div>

      {created === "invalid" && <div className="card"><b>Revisa el asunto y la descripción del caso.</b></div>}
      {created === "error" && <div className="card"><b>No pudimos crear el ticket. Intenta de nuevo.</b></div>}

      <section className="card" style={{marginTop:18}}>
        <h2>Abrir un ticket</h2>
        <form action="/api/support/tickets" method="post" style={{display:"grid",gap:12,maxWidth:780}}>
          <input type="hidden" name="original_query" value={q} />
          <label htmlFor="ticket-subject"><b>Asunto</b></label>
          <input id="ticket-subject" name="subject" minLength={3} maxLength={180} required style={{padding:11,borderRadius:10,border:"1px solid #d8dee8"}} />
          <label htmlFor="ticket-category"><b>Categoría</b></label>
          <select id="ticket-category" name="category" defaultValue="tecnico" style={{padding:11,borderRadius:10,border:"1px solid #d8dee8"}}>
            <option value="cuenta">Cuenta y acceso</option>
            <option value="aprendizaje">Aprendizaje y progreso</option>
            <option value="facturacion">Planes y facturación</option>
            <option value="tutor_ia">Tutor IA</option>
            <option value="certificado">Certificado</option>
            <option value="privacidad">Privacidad y datos</option>
            <option value="tecnico">Problema técnico</option>
            <option value="otro">Otro</option>
          </select>
          <label htmlFor="ticket-description"><b>Describe el problema</b></label>
          <textarea id="ticket-description" name="description" rows={8} minLength={10} maxLength={8000} required placeholder="Qué intentabas hacer, qué ocurrió y qué esperabas que ocurriera." style={{padding:11,borderRadius:10,border:"1px solid #d8dee8"}} />
          <p className="muted" style={{fontSize:13}}>Evita incluir información sensible o credenciales.</p>
          <button className="btn" type="submit">Crear ticket</button>
        </form>
      </section>

      <section className="card" style={{marginTop:18}}>
        <h2>Historial</h2>
        {(tickets ?? []).length === 0 ? <p className="muted">Todavía no tienes tickets.</p> : (
          <div style={{display:"grid",gap:10}}>
            {(tickets ?? []).map((ticket) => (
              <Link key={ticket.id} href={"/help/tickets/"+ticket.id} style={{borderTop:"1px solid #e5e9f0",paddingTop:12}}>
                <b>#{ticket.id} · <span translate="no">{ticket.subject}</span></b>
                <div className="muted">{ticket.category} · {ticket.priority} · {ticket.status}</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main></LocalizedContent>
  );
}

