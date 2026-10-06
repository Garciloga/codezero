import { redirect } from "next/navigation";
import { createServerSupabase } from "../../lib/supabase-server";
import { createAdminSupabase, requireAdmin } from "../../lib/admin";

type PageProps = {
  searchParams: Promise<{ updated?: string }>;
};

export default async function Admin({ searchParams }: PageProps) {
  const { updated } = await searchParams;

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  try {
    await requireAdmin(user.id);
  } catch {
    redirect("/dashboard");
  }

  const admin = createAdminSupabase();

  const [
    { data: users },
    { data: plans },
    { count: examAttempts },
    { count: projectSubmissions },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id,email,full_name,role,plan_name,status,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    admin.from("plans").select("*").order("sort_order"),
    admin.from("exam_attempts").select("*", { count: "exact", head: true }),
    admin.from("project_submissions").select("*", { count: "exact", head: true }),
  ]);

  return (
    <main className="wrap">
      <div className="nav">
        <div>
          <span className="pill">OWNER / ADMIN</span>
          <h1>CodeZero Control Center</h1>
          <p className="muted">Usuarios, planes, acceso y actividad académica.</p>
        </div>
        <a className="btn secondary" href="/dashboard">Mi cuenta</a>
      </div>

      {updated === "1" && (
        <div className="card" style={{ marginBottom: 18 }}>
          <b>Usuario actualizado.</b>
        </div>
      )}

      <div className="grid grid4">
        <div className="card">
          <div className="muted">Usuarios</div>
          <div className="stat">{users?.length ?? 0}</div>
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
          <div className="muted">Proyectos enviados</div>
          <div className="stat">{projectSubmissions ?? 0}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h2>Usuarios</h2>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr>
                <th align="left">Email</th>
                <th align="left">Rol</th>
                <th align="left">Plan</th>
                <th align="left">Estado</th>
                <th align="left">Acción</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id} style={{ borderTop: "1px solid #e5e9f0" }}>
                  <td style={{ padding: "14px 8px" }}>{u.email}</td>
                  <td style={{ padding: "14px 8px" }}>{u.role}</td>
                  <td style={{ padding: "14px 8px" }} colSpan={3}>
                    <form
                      action="/api/admin/users/update"
                      method="post"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "160px 160px auto",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <input type="hidden" name="user_id" value={u.id} />

                      <select
                        name="plan_name"
                        defaultValue={u.plan_name}
                        style={{ padding: 10, borderRadius: 10, border: "1px solid #d8dee8" }}
                      >
                        {(plans ?? []).map((plan) => (
                          <option key={plan.id} value={plan.name}>
                            {plan.name}
                          </option>
                        ))}
                      </select>

                      <select
                        name="status"
                        defaultValue={u.status}
                        style={{ padding: 10, borderRadius: 10, border: "1px solid #d8dee8" }}
                      >
                        <option value="active">active</option>
                        <option value="suspended">suspended</option>
                        <option value="cancelled">cancelled</option>
                      </select>

                      <button className="btn secondary" type="submit">
                        Guardar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h2>Planes</h2>
        <div className="grid grid2">
          {(plans ?? []).map((plan) => (
            <div key={plan.id}>
              <b>{plan.name}</b>
              <p className="muted">
                {"$" + (plan.price_monthly_cents / 100).toFixed(0)} MXN/mes ·
                ejercicios {plan.exercise_limit} · exámenes {plan.exam_limit} ·
                IA {plan.ai_query_limit} · proyectos {plan.project_limit}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
