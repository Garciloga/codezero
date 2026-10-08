import LocalizedDate from '../../components/localization/date';
import LocalizedContent from "../../components/localization/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "../../../lib/supabase-server";

type PageProps = { searchParams: Promise<{ submitted?: string }> };

export default async function SuggestionsPage({ searchParams }: PageProps) {
  const { submitted } = await searchParams;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: suggestions } = await supabase
    .from("support_suggestions")
    .select("id,title,category,status,created_at")
    .eq("user_id",user.id)
    .order("created_at",{ascending:false})
    .limit(20);

  return (
    <LocalizedContent><main className="wrap">
      <div className="nav">
        <div>
          <span className="pill">SUGERENCIAS</span>
          <h1>Ayúdanos a mejorar Garciloga</h1>
          <p className="muted">Ideas de producto, mejoras de contenido, dudas confusas o una nueva FAQ.</p>
        </div>
        <Link prefetch={false} className="btn secondary" href="/help">Centro de ayuda</Link>
      </div>

      {submitted === "1" && <div className="card"><b>Sugerencia enviada. Gracias por ayudarnos a mejorar.</b></div>}
      {submitted === "invalid" && <div className="card"><b>Revisa el título y el detalle antes de enviar.</b></div>}
      {submitted === "error" && <div className="card"><b>No pudimos guardar la sugerencia. Intenta de nuevo.</b></div>}

      <section className="card" style={{marginTop:18}}>
        <form action="/api/support/suggestions" method="post" style={{display:"grid",gap:12,maxWidth:760}}>
          <label htmlFor="suggestion-title"><b>Título</b></label>
          <input id="suggestion-title" name="title" minLength={3} maxLength={160} required style={{padding:11,borderRadius:10,border:"1px solid #d8dee8"}} />
          <label htmlFor="suggestion-category"><b>Categoría</b></label>
          <select id="suggestion-category" name="category" defaultValue="producto" style={{padding:11,borderRadius:10,border:"1px solid #d8dee8"}}>
            <option value="producto">Producto</option>
            <option value="contenido">Contenido</option>
            <option value="faq">Nueva FAQ</option>
            <option value="experiencia">Experiencia de uso</option>
            <option value="otro">Otro</option>
          </select>
          <label htmlFor="suggestion-detail"><b>Detalle</b></label>
          <textarea id="suggestion-detail" name="detail" rows={7} minLength={10} maxLength={5000} required style={{padding:11,borderRadius:10,border:"1px solid #d8dee8"}} />
          <button className="btn" type="submit">Enviar sugerencia</button>
        </form>
      </section>

      <section className="card" style={{marginTop:18}}>
        <h2>Mis sugerencias</h2>
        {(suggestions ?? []).length === 0 ? <p className="muted">Todavía no has enviado sugerencias.</p> : (
          <div style={{display:"grid",gap:10}}>
            {(suggestions ?? []).map((item) => (
              <div key={item.id} style={{borderTop:"1px solid #e5e9f0",paddingTop:10}}>
                <b>{item.title}</b>
                <div className="muted">{item.category} · {item.status} · <LocalizedDate value={item.created_at} /></div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main></LocalizedContent>
  );
}

