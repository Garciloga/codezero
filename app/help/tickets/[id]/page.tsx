import LocalizedDate from '../../../components/localization/date';
import LocalizedContent from "../../../components/localization/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabase } from "../../../../lib/supabase-server";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; reply?: string }>;
};

export default async function TicketPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { created, reply } = await searchParams;
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId)) notFound();

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id,subject,description,category,priority,status,created_at,updated_at")
    .eq("id",ticketId)
    .eq("user_id",user.id)
    .maybeSingle();

  if (!ticket) notFound();

  const { data: messages } = await supabase
    .from("support_ticket_messages")
    .select("id,sender_role,body,created_at")
    .eq("ticket_id",ticketId)
    .order("created_at",{ascending:true});

  return (
    <LocalizedContent><main className="wrap">
      <div className="nav">
        <div>
          <span className="pill">TICKET #{ticket.id}</span>
          <h1><span translate="no">{ticket.subject}</span></h1>
          <p className="muted">{ticket.category} · prioridad {ticket.priority} · estado {ticket.status}</p>
        </div>
        <Link className="btn secondary" href="/help/tickets">Mis tickets</Link>
      </div>

      {created === "1" && <div className="card"><b>Ticket creado correctamente.</b></div>}
      {reply === "1" && <div className="card"><b>Respuesta enviada.</b></div>}
      {reply === "error" && <div role="alert" className="card">No fue posible guardar.</div>}
      {reply === "closed" && <div className="card"><b>Este ticket está cerrado.</b></div>}

      <section className="card" style={{marginTop:18}}>
        <h2>Conversación</h2>
        <div style={{display:"grid",gap:12}}>
          {(messages ?? []).map((message) => (
            <div key={message.id} className="support-message" style={{padding:14,borderRadius:12}}>
              <b>{message.sender_role === "admin" ? "CodeZero Support" : "Tú"}</b>
              <p style={{whiteSpace:"pre-wrap",lineHeight:1.6}}><span translate="no">{message.body}</span></p>
              <div className="muted" style={{fontSize:12}}><LocalizedDate value={message.created_at} includeTime /></div>
            </div>
          ))}
        </div>
      </section>

      {ticket.status !== "closed" && (
        <section className="card" style={{marginTop:18}}>
          <h2>Responder</h2>
          <form action={"/api/support/tickets/"+ticket.id+"/reply"} method="post" style={{display:"grid",gap:10}}>
            <label htmlFor="reply-body"><b>Mensaje</b></label>
            <textarea id="reply-body" name="body" rows={6} maxLength={8000} required style={{padding:11,borderRadius:10,border:"1px solid #d8dee8"}} />
            <button className="btn" type="submit">Enviar respuesta</button>
          </form>
        </section>
      )}
    </main></LocalizedContent>
  );
}

