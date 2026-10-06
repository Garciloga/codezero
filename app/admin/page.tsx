import { redirect } from "next/navigation";
import { createServerSupabase } from "../../lib/supabase-server";
import { createAdminSupabase, requireAdmin } from "../../lib/admin";

export default async function Admin() {
  const supabase = await createServerSupabase();
  const {data:{user}} = await supabase.auth.getUser();
  if (!user) redirect("/login");
  try { await requireAdmin(user.id); } catch { redirect("/dashboard"); }

  const admin = createAdminSupabase();
  const [{data:users},{data:plans}] = await Promise.all([
    admin.from("profiles").select("id,email,full_name,role,plan_name,status,created_at").order("created_at",{ascending:false}).limit(100),
    admin.from("plans").select("*").order("sort_order")
  ]);

  return <main className="wrap">
    <div className="nav"><div><span className="pill">OWNER / ADMIN</span><h1>CodeZero Control Center</h1></div><a className="btn secondary" href="/dashboard">Mi cuenta</a></div>
    <div className="grid grid4">
      <div className="card"><div className="muted">Usuarios</div><div className="stat">{users?.length ?? 0}</div></div>
      <div className="card"><div className="muted">Planes</div><div className="stat">{plans?.length ?? 0}</div></div>
      <div className="card"><div className="muted">Activos</div><div className="stat">{users?.filter(u=>u.status==="active").length ?? 0}</div></div>
      <div className="card"><div className="muted">Control</div><div className="stat">Total</div></div>
    </div>
    <div className="card" style={{marginTop:18}}>
      <h2>Usuarios</h2>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr><th align="left">Email</th><th>Plan</th><th>Estado</th><th>Rol</th></tr></thead>
        <tbody>{users?.map(u=><tr key={u.id}><td>{u.email}</td><td>{u.plan_name}</td><td>{u.status}</td><td>{u.role}</td></tr>)}</tbody>
      </table></div>
    </div>
  </main>;
}

