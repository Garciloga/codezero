import { serverTranslator } from "../../lib/localization/server";
import LocalizedContent from "../components/localization/server";
import Link from "next/link";
import { createServerSupabase, getServerUser } from "../../lib/supabase-server";

type PageProps = { searchParams: Promise<{ q?: string; feedback?: string }> };

const categories = [
  "Cuenta y acceso",
  "Aprendizaje y progreso",
  "Ejercicios y exámenes",
  "Planes y facturación",
  "Tutor IA",
  "Certificados",
  "Privacidad y datos",
  "Problemas técnicos",
];

export default async function HelpPage({ searchParams }: PageProps) {
  const { q = "", feedback } = await searchParams;
  const query = q.trim();
  const supabase = await createServerSupabase();
  const { data: { user } } = await getServerUser();

  const t = await serverTranslator();
  const request = supabase
    .from("support_faqs")
    .select("id,slug,question,answer,category,keywords,sort_order")
    .eq("status","published")
    .order("sort_order");

  const { data: sourceFaqs } = await request;
  const normalizeSearch = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  const faqs = (sourceFaqs ?? []).filter(faq => {
    const text = normalizeSearch([faq.question, faq.answer, faq.category, t(faq.question), t(faq.answer), t(faq.category), ...(faq.keywords ?? [])].join(" "));
    return terms.every(term => text.includes(term));
  });
  const byCategory = new Map<string, typeof faqs>();
  for (const category of categories) {
    byCategory.set(category, (faqs ?? []).filter((faq) => faq.category === category));
  }

  return (
    <LocalizedContent><main className="wrap">
      <div className="nav">
        <div>
          <span className="pill">GARCILOGA SUPPORT</span>
          <h1>Centro de ayuda</h1>
          <p className="muted">Busca una respuesta. Si no la encuentras, puedes enviar una sugerencia o abrir un ticket.</p>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {user ? <Link prefetch={false} className="btn secondary" href="/help/tickets">Mis tickets</Link> : null}
          <Link prefetch={false} className="btn secondary" href="/">Inicio</Link>
        </div>
      </div>

      <section className="card">
        <form action="/help" method="get" style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <label htmlFor="help-search" style={{position:"absolute",left:"-9999px"}}>Buscar en ayuda</label>
          <input
            id="help-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Ej. no recibo correo, examen, Tutor IA..."
            style={{flex:"1 1 320px",padding:12,borderRadius:10,border:"1px solid #d8dee8"}}
          />
          <button className="btn" type="submit">Buscar</button>
          {query ? <Link prefetch={false} className="btn secondary" href="/help">Limpiar</Link> : null}
        </form>
        {query && (
          <p className="muted" style={{marginBottom:0}}>
            {(faqs ?? []).length} resultado(s) para “<span translate="no">{query}</span>”.
          </p>
        )}
        {feedback === "1" && <p role="status"><b>Gracias. Tu respuesta nos ayuda a mejorar el Centro de ayuda.</b></p>}
      </section>

      {!query && (
        <section style={{marginTop:24}}>
          <h2>Categorías</h2>
          <div className="grid grid4">
            {categories.map((category) => {
              const count = byCategory.get(category)?.length ?? 0;
              return (
                <a className="card" key={category} href={"#"+category.toLowerCase().replaceAll(" ","-")}>
                  <b>{category}</b>
                  <p className="muted" style={{marginBottom:0}}>{count} respuesta(s)</p>
                </a>
              );
            })}
          </div>
        </section>
      )}

      <section style={{marginTop:28,display:"grid",gap:24}}>
        {(query ? [["Resultados", faqs ?? []] as const] : Array.from(byCategory.entries()))
          .filter(([,items]) => (items?.length ?? 0) > 0)
          .map(([category,items]) => (
            <div key={category} id={category.toLowerCase().replaceAll(" ","-")}>
              <h2>{category}</h2>
              <div style={{display:"grid",gap:12}}>
                {(items ?? []).map((faq) => (
                  <details className="card" key={faq.id}>
                    <summary style={{cursor:"pointer",fontWeight:700,fontSize:18}}>{faq.question}</summary>
                    <p style={{lineHeight:1.7}}>{faq.answer}</p>
                    {user ? (
                      <form action="/api/support/feedback" method="post" style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                        <input type="hidden" name="faq_id" value={faq.id} />
                        <input type="hidden" name="query_text" value={query} />
                        <span className="muted">¿Te ayudó?</span>
                        <button className="btn secondary" name="helpful" value="true" type="submit">Sí</button>
                        <button className="btn secondary" name="helpful" value="false" type="submit">No</button>
                      </form>
                    ) : (
                      <p className="muted" style={{fontSize:13}}>Inicia sesión para valorar esta respuesta o abrir un ticket.</p>
                    )}
                  </details>
                ))}
              </div>
            </div>
          ))}
      </section>

      <section className="card" style={{marginTop:30}}>
        <h2>¿No encontraste la respuesta?</h2>
        <p className="muted">El soporte está integrado dentro de Garciloga.</p>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {user ? (
            <>
              <Link prefetch={false} className="btn" href={"/help/tickets"+(query ? "?q="+encodeURIComponent(query) : "")}>Abrir ticket</Link>
              <Link prefetch={false} className="btn secondary" href="/help/suggestions">Enviar sugerencia</Link>
            </>
          ) : (
            <Link prefetch={false} className="btn" href="/login">Iniciar sesión</Link>
          )}
        </div>
      </section>
    </main></LocalizedContent>
  );
}

