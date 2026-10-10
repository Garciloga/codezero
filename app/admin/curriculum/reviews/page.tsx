import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getServerUser} from "../../../../lib/supabase-server";
import {requireOwner,createAdminSupabase} from "../../../../lib/admin";
import {POSITION_PROGRAMS} from "../../../../lib/position-curriculum";
import {editorialFingerprint,effectiveEditorialState,type EditorialRow} from "../../../../lib/editorial-review";
import {localeContext} from "../../../../lib/localization/server";
import LocalizedContent from "../../../components/localization/server";
export const dynamic="force-dynamic";
type Props={searchParams:Promise<{program?:string;filter?:string}>};
export default async function OwnerEditorialReviews({searchParams}:Props){
 const {data:{user}}=await getServerUser();if(!user)redirect("/login");try{await requireOwner(user.id);}catch{notFound();}
 const params=await searchParams,program=POSITION_PROGRAMS[params.program??""]??POSITION_PROGRAMS["onboarding"];
 const {locale}=await localeContext(),db=createAdminSupabase();
 const {data, error}=await db.from("owner_lesson_editorial_reviews").select("lesson_key,content_hash,state,note").eq("program_key",program.key).limit(200);
 if(error)throw Error("OWNER_EDITORIAL_REVIEWS_UNAVAILABLE");
 const entries=(data??[]) as EditorialRow[],saved=new Map(entries.map(e=>[e.lesson_key,e]));
 const overview=program.lessons.map(item=>{
  const hash=editorialFingerprint(item),row=saved.get(item.key);return {item,hash,state:effectiveEditorialState(row,hash),note:row?.content_hash===hash?(row?.note??""):""};
 });
 const reviewed=overview.filter(x=>x.state==="reviewed").length,observations=overview.filter(x=>x.state==="observation").length;
 const pending=overview.length-reviewed-observations;
 const perLevel=program.levels.map(x=>({number:x.number,total:overview.filter(i=>i.item.level===x.number).length,reviewed:overview.filter(i=>i.item.level===x.number&&i.state==="reviewed").length,observations:overview.filter(i=>i.item.level===x.number&&i.state==="observation").length}));
 const filter=params.filter==="pending"||params.filter==="observation"?params.filter:"all";
 const shown=filter==="all"?overview:overview.filter(x=>filter==="pending"?x.state==="pending":x.state==="observation");
 const next=overview.find(x=>x.state==="pending"||x.state==="observation");
 const href=(key:string,f:string)=>"/admin/curriculum/reviews?program="+encodeURIComponent(key)+"&filter="+f;
 return <LocalizedContent><main className="wrap owner-editorial">
  <div className="nav"><div><span className="pill">Solo propietario</span><h1>Revisión editorial por lección</h1><p>Registra cada revisión sin editar la lección ni afectar el avance de estudiantes.</p></div><Link className="btn secondary" href="/admin/curriculum">Volver al inspector</Link></div>
  <nav className="card" aria-label="Seleccionar programa"><h2>Programa</h2><div className="public-actions">{Object.values(POSITION_PROGRAMS).map(p=><Link key={p.key} className={"btn "+(p.key===program.key?"":"secondary")} href={href(p.key,"all")}>{p.title}</Link>)}</div></nav>
  <section className="card owner-editorial-overview" aria-label="Estado editorial"><h2>{program.title}</h2><p><strong>{reviewed} de {overview.length}</strong> lecciones revisadas; {observations} con observación; {pending} sin revisar.</p>
   <progress value={reviewed} max={overview.length} aria-label="Lecciones revisadas" />
   <p className="muted">{reviewed===overview.length&&observations===0?"Revisión de lecciones completa. La aprobación pedagógica final y traducciones siguen requiriendo validación humana.":"El programa permanece pendiente mientras haya lecciones sin revisar u observaciones abiertas."}</p>
   <div className="owner-editorial-levels" aria-label="Avance por nivel">{perLevel.map(x=><p key={x.number}>Nivel {x.number}: <strong>{x.reviewed}/{x.total}</strong>{x.observations>0?" · "+x.observations+" con observación":""}</p>)}</div>
   <div className="public-actions"><Link className="btn secondary" href={href(program.key,"all")}>Todas</Link><Link className="btn secondary" href={href(program.key,"pending")}>Sin revisar</Link><Link className="btn secondary" href={href(program.key,"observation")}>Con observación</Link><Link className="btn secondary" prefetch={false} href={"/admin/curriculum/reviews/export?program="+encodeURIComponent(program.key)}>Exportar observaciones (CSV)</Link>{next&&<Link className="btn" href={href(program.key,"all")+"#"+encodeURIComponent(next.item.key)}>Siguiente pendiente</Link>}</div>
  </section>
  <section className="owner-editorial-list" aria-label="Lecciones para revisar">
  {shown.map(({item,hash,state,note})=><article className="card owner-editorial-item" key={item.key} id={item.key}>
    <div className="owner-editorial-item-head"><div><span className="pill">{state==="reviewed"?"Revisada":state==="observation"?"Con observación":"Sin revisar"}</span><h2>Nivel {item.level} · {item.title[locale]||item.title.es}</h2><p className="muted"><code>{item.key}</code></p></div>
      <Link className="btn secondary" href={"/admin/curriculum?position="+encodeURIComponent(program.key)+"&level="+item.level+"&item="+encodeURIComponent(item.key)}>Leer en inspector</Link></div>
    <form className="owner-editorial-form" action="/api/admin/curriculum/reviews" method="post">
      <input type="hidden" name="program" value={program.key}/><input type="hidden" name="lesson" value={item.key}/><input type="hidden" name="hash" value={hash}/>
      <label>Nota editorial (máximo 500 caracteres)<textarea name="note" rows={2} maxLength={500} defaultValue={note} placeholder="Explica el cambio necesario; no incluyas datos personales de estudiantes."/></label>
      <div className="public-actions"><button type="submit" className="btn" name="state" value="reviewed">Marcar revisada</button><button type="submit" className="btn secondary" name="state" value="observation">Guardar observación</button></div>
    </form>
   </article>)}
   {!shown.length&&<p className="card">No hay lecciones para este filtro.</p>}
  </section>
 </main></LocalizedContent>;
}
