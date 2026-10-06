import { redirect } from "next/navigation";
import { createServerSupabase } from "../../lib/supabase-server";
import { getEntitlements } from "../../lib/entitlements";

export default async function Dashboard() {
  const supabase = await createServerSupabase();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const ent = await getEntitlements(user.id);

  const usage = (ent as any).usage ?? {};
  const pct = (used:number, limit:number) => limit < 0 ? 0 : Math.min(100, Math.round(used/Math.max(1,limit)*100));

  return <main className="wrap">
    <div className="nav"><div><span className="pill">{ent.plan_name}</span><h1>Mi CodeZero</h1></div><form action="/api/auth/signout" method="post"><button className="btn secondary">Salir</button></form></div>
    <div className="grid grid4">
      <div className="card"><div className="muted">Plan</div><div className="stat">{ent.plan_name}</div></div>
      <div className="card"><div className="muted">Ejercicios</div><div className="stat">{usage.exercises ?? 0}/{ent.exercise_limit}</div></div>
      <div className="card"><div className="muted">ExÃ¡menes</div><div className="stat">{usage.exams ?? 0}/{ent.exam_limit}</div></div>
      <div className="card"><div className="muted">Consultas IA</div><div className="stat">{usage.ai_queries ?? 0}/{ent.ai_query_limit}</div></div>
    </div>
    <div className="grid grid2" style={{marginTop:18}}>
      {[
        ["Ejercicios",usage.exercises??0,ent.exercise_limit],
        ["ExÃ¡menes",usage.exams??0,ent.exam_limit],
        ["IA Tutor",usage.ai_queries??0,ent.ai_query_limit],
        ["Proyectos",usage.projects??0,ent.project_limit]
      ].map(([name,used,limit])=><div className="card" key={name as string}><b>{name}</b><p className="muted">{used} usados de {limit}</p><div className="bar"><i style={{width:`${pct(used as number,limit as number)}%`}}/></div></div>)}
    </div>
  </main>;
}

