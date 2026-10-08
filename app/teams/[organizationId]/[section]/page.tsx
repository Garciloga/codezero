import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOrganization } from "../../../../lib/organization-server";
import { ORGANIZATION_ROLES } from "../../../../lib/organization-metrics";
import LocalizedContent from "../../../components/localization/server";
import PersonCard, {
  SkillBars,
} from "../../../components/enterprise/person-card";
import Organigram from "../../../components/enterprise/organigram";
import PermissionsTable from "../../../components/enterprise/permissions-table";
import { readWorkspacePages } from "../../../../lib/workspace-pages";
const actions: Record<string, string> = {
  organization_created: "Organización creada",
  membership_updated: "Puesto y jerarquía actualizados",
  invitation_created: "Invitación creada",
  invitation_accepted: "Invitación aceptada",
  activity_assigned: "Aprendizaje asignado",
  job_title_updated: "Puesto de trabajo actualizado",
};
const leaders = ["owner", "admin", "manager", "supervisor"];
const titles: Record<string, string> = {
  people: "Personas",
  organization: "Organigrama",
  progress: "Avance",
  skills: "Fortalezas y áreas de mejora",
  assign: "Asignar aprendizaje",
  tasks: "Mis tareas",
  invite: "Invitar personas",
  permissions: "Puestos y permisos",
  modules: "Módulos",
  history: "Historial de cambios",
  billing: "Facturación",
};
export default async function TeamSection({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string; section: string }>;
  searchParams: Promise<{ result?: string }>;
}) {
  const { organizationId: org, section } = await params;
  if (!titles[section]) redirect("/dashboard");
  const allowed =
    section === "tasks"
      ? Object.keys(ORGANIZATION_ROLES)
      : section === "billing"
        ? ["owner"]
        : ["invite", "permissions", "modules", "history"].includes(section)
          ? ["owner", "admin"]
          : leaders;
  const d = await requireOrganization(org, allowed);
  const team = d.people.filter((p) => p.user_id !== d.user.id);
  const own = d.people.find((p) => p.user_id === d.user.id);
  const rated = team.filter((p) => p.percent !== null);
  const avg = rated.length
    ? Math.round(rated.reduce((s, p) => s + (p.percent ?? 0), 0) / rated.length)
    : null;
  const skills = [
    ...new Set(team.flatMap((p) => p.competencies.map((c) => c.name))),
  ].map((name) => {
    const scores = team.flatMap((p) =>
      p.competencies
        .filter((c) => c.name === name && c.score !== null)
        .map((c) => c.score as number),
    );
    return {
      name,
      score: scores.length
        ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length)
        : null,
    };
  });
  const hidden = (action: string) => (
    <>
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="organization_id" value={org} />
    </>
  );
  const roles = (value = "learner") => (
    <label>
      Puesto{" "}
      <select name="role" defaultValue={value}>
        {Object.entries(ORGANIZATION_ROLES)
          .filter(([r]) => r !== "owner" || d.own.role === "owner")
          .map(([r, label]) => (
            <option key={r} value={r}>
              {label}
            </option>
          ))}
      </select>
    </label>
  );
  const reports = (value: string | null = null, exclude?: string) => (
    <label>
      Reporta a{" "}
      <select name="reports_to" defaultValue={value ?? ""}>
        <option value="">Sin jefe directo</option>
        {d.directory
          .filter((p) => p.role !== "learner" && p.user_id !== exclude)
          .map((p) => (
            <option key={p.user_id} value={p.user_id} translate="no">
              {p.display_name}
            </option>
          ))}
      </select>
    </label>
  );
  const result = (await searchParams).result;
  let catalog: { id: number; title: string; type: string }[] = [];
  let catalogError = false;
  if (["assign", "modules"].includes(section)) {
    const r = await Promise.all(
      ["lessons", "level_exams", "level_projects"].map((table) =>
        readWorkspacePages<{ id: number; title: string }>((a, b) =>
          d.supabase
            .from(table)
            .select("id,title")
            .eq("status", "published")
            .order("id")
            .range(a, b),
        ),
      ),
    );
    catalogError = r.some((x) => x.error);
    catalog = r.flatMap((x, i) =>
      (x.data ?? []).map((a) => ({
        ...a,
        type: ["lesson", "exam", "project"][i],
      })),
    );
  }
  const taskLinks = new Map<string, string>();
  if (section === "tasks" && own?.tasks.length) {
    const [levels, lessons, exams, projects] = await Promise.all([
      d.supabase.from("levels").select("id,level_number"),
      d.supabase
        .from("lessons")
        .select("id,level_id,slug")
        .eq("status", "published"),
      d.supabase
        .from("level_exams")
        .select("id,level_id")
        .eq("status", "published"),
      d.supabase
        .from("level_projects")
        .select("id,level_id")
        .eq("status", "published"),
    ]);
    for (const t of own.tasks) {
      const a = (
        t.activity_type === "lesson"
          ? lessons.data
          : t.activity_type === "exam"
            ? exams.data
            : projects.data
      )?.find((x) => x.id === t.activity_id);
      const level = levels.data?.find((x) => x.id === a?.level_id);
      if (level && a)
        taskLinks.set(
          t.activity_key,
          `/learn/${level.level_number}/${t.activity_type === "lesson" ? ("slug" in a ? String(a.slug) : "") : t.activity_type}`,
        );
    }
  }
  const audit =
    section === "history"
      ? await readWorkspacePages<{
          id: string;
          action: string;
          created_at: string;
        }>((a, b) =>
          d.supabase
            .from("organization_audit_log")
            .select("id,action,created_at")
            .eq("organization_id", org)
            .order("created_at", { ascending: false })
            .order("id")
            .range(a, b),
        )
      : null;
  const managementRoster =
    section === "permissions"
      ? await readWorkspacePages<
          import("../../../../lib/organization-metrics").Member
        >((a, b) =>
          d.supabase
            .from("organization_memberships")
            .select("user_id,display_name,role,reports_to,active,job_title")
            .eq("organization_id", org)
            .order("user_id")
            .range(a, b),
        )
      : null;
  const invitations =
    section === "invite"
      ? await d.supabase
          .from("organization_invitations")
          .select("id,email,role")
          .eq("organization_id", org)
          .is("accepted_at", null)
      : null;
  return (
    <LocalizedContent>
      <main className="wrap">
        <h1>
          {section === "people" ? (
            <>
              Hola, <span translate="no">{d.own.display_name}</span>
            </>
          ) : (
            titles[section]
          )}
        </h1>
        <p>
          {section === "people" ? (
            "Así va tu equipo."
          ) : (
            <span translate="no">{d.organization.name}</span>
          )}
        </p>
        {result && (
          <p role="status">
            {result === "saved"
              ? "Cambios guardados."
              : result === "invitation_pending"
                ? "Invitación preparada. Comparte el enlace con la persona; debe iniciar sesión con el correo invitado."
                : "No se pudo completar el cambio. Revisa permisos, roles y jefaturas."}
          </p>
        )}
        {["people", "progress"].includes(section) && (
          <>
            <div className="vivo-kpis">
              <article className="card primary">
                <strong>{team.length}</strong>
                <p>Personas a tu cargo</p>
              </article>
              <article className="card accent">
                <strong>{avg === null ? "—" : avg + "%"}</strong>
                <p>Avance promedio</p>
              </article>
              <article className="card">
                <strong>{team.filter((p) => p.alert).length}</strong>
                <p>Con alerta</p>
              </article>
              <article className="card positive">
                <strong>{team.reduce((s, p) => s + p.pending, 0)}</strong>
                <p>Tareas pendientes</p>
              </article>
            </div>
            {!team.length ? (
              <section className="card">
                <p>Aún no hay personas a tu cargo.</p>
                {["owner", "admin"].includes(d.own.role) && (
                  <Link
                    prefetch={false}
                    className="btn"
                    href={`/teams/${org}/invite`}
                  >
                    Invita a tu primera persona
                  </Link>
                )}
              </section>
            ) : (
              <div className="vivo-person-grid">
                {team.map((p) => (
                  <PersonCard key={p.user_id} person={p} org={org} />
                ))}
              </div>
            )}
            <form action="/api/teams/manage" method="post">
              {hidden("refresh")}
              <button className="btn secondary">
                Actualizar desde el aprendizaje registrado
              </button>
            </form>
            <a className="btn secondary" href={`/api/teams/${org}/report`}>
              Descargar reporte CSV de mi alcance
            </a>
          </>
        )}
        {section === "organization" &&
          ["owner", "admin"].includes(d.own.role) && (
            <Link
              prefetch={false}
              className="btn secondary"
              href={`/teams/${org}/permissions`}
            >
              Editar puestos y jerarquía
            </Link>
          )}
        {["people", "organization"].includes(section) && (
          <Organigram
            members={d.directory}
            visible={d.people.map((p) => p.user_id)}
            user={d.user.id}
          />
        )}
        {["people", "skills"].includes(section) && (
          <section className="card">
            <h2>Competencias del equipo</h2>
            <SkillBars skills={skills} />
          </section>
        )}
        {["people", "permissions"].includes(section) && (
          <PermissionsTable role={d.own.role} />
        )}
        {section === "permissions" && managementRoster?.error && (
          <p>No pudimos cargar el equipo</p>
        )}
        {section === "permissions" &&
          !managementRoster?.error &&
          (managementRoster?.data ?? [])
            .filter((p) => d.own.role === "owner" || p.role !== "owner")
            .map((p) => (
              <section className="card" key={p.user_id}>
                <h2 translate="no">{p.display_name}</h2>
                <form action="/api/teams/manage" method="post">
                  {hidden("member")}
                  <input type="hidden" name="user_id" value={p.user_id} />
                  {roles(p.role)}
                  {reports(p.reports_to, p.user_id)}
                  <label>
                    Puesto de trabajo{" "}
                    <input
                      name="job_title"
                      defaultValue={p.job_title ?? ""}
                      maxLength={120}
                    />
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="active"
                      value="1"
                      defaultChecked={p.active}
                    />{" "}
                    Acceso activo
                  </label>
                  <button className="btn">Guardar rol y jefe</button>
                </form>
              </section>
            ))}
        {section === "tasks" && (
          <section className="card">
            {!own?.tasks.length ? (
              <p>Sin tareas asignadas</p>
            ) : (
              <ul>
                {own.tasks.map((t) => (
                  <li key={t.activity_key}>
                    {taskLinks.has(t.activity_key) ? (
                      <Link
                        prefetch={false}
                        href={taskLinks.get(t.activity_key)!}
                      >
                        <span>{t.title}</span>
                      </Link>
                    ) : (
                      <span>{t.title}</span>
                    )}{" "}
                    · <span translate="no">{t.competency}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        {section === "assign" && (
          <section className="card">
            <form action="/api/teams/manage" method="post">
              {hidden("assign")}
              <label>
                Persona{" "}
                <select name="user_id" required>
                  {d.people.map((p) => (
                    <option key={p.user_id} value={p.user_id} translate="no">
                      {p.display_name}
                    </option>
                  ))}
                </select>
              </label>
              {catalogError ? (
                <p>No pudimos cargar el catálogo; recarga antes de asignar.</p>
              ) : (
                <label>
                  Actividad publicada{" "}
                  <select name="activity_key" required defaultValue="">
                    <option value="" disabled>
                      Elige una actividad
                    </option>
                    {catalog.map((a) => (
                      <option
                        key={a.type + a.id}
                        value={`${a.type}:${a.id}`}
                      >
                        {a.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Competencia a practicar{" "}
                <input name="competency" maxLength={80} required />
              </label>
              <button
                className="btn"
                disabled={catalogError || !catalog.length}
              >
                Asignar actividad
              </button>
            </form>
            <p>
              Asignar una actividad no cambia el plan ni desbloquea contenido
              fuera de sus derechos actuales.
            </p>
          </section>
        )}
        {section === "invite" && (
          <section className="card">
            <p>
              La persona debe registrarse y confirmar el correo invitado.
              Comparte el enlace de incorporación; cada persona conserva su
              contraseña privada.
            </p>
            <form action="/api/teams/manage" method="post">
              {hidden("invite")}
              <label>
                Correo{" "}
                <input name="email" type="email" required maxLength={200} />
              </label>
              {roles()}
              {reports()}
              <button className="btn">Preparar invitación</button>
            </form>
            {invitations?.error ? (
              <p>No pudimos cargar las invitaciones.</p>
            ) : (
              <ul>
                {invitations?.data?.map((i) => (
                  <li key={i.id}>
                    <span translate="no">{i.email}</span> ·{" "}
                    <Link prefetch={false} href={`/teams/join?id=${i.id}`}>
                      Abrir incorporación
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        {section === "modules" && (
          <section className="card">
            <p>
              Catálogo publicado. Los permisos y límites de cada plan se
              conservan.
            </p>
            {catalogError ? (
              <p>No pudimos cargar el catálogo; recarga antes de asignar.</p>
            ) : (
              <ul>
                {catalog.map((a) => (
                  <li key={a.type + a.id}>{a.title}</li>
                ))}
              </ul>
            )}
          </section>
        )}
        {section === "history" && (
          <section className="card">
            {audit?.error ? (
              <p>No pudimos cargar el historial.</p>
            ) : !audit?.data?.length ? (
              <p>Aún no hay cambios registrados.</p>
            ) : (
              <div className="vivo-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Cambio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audit.data.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <time dateTime={a.created_at}>
                            {a.created_at.slice(0, 10)}
                          </time>
                        </td>
                        <td>{actions[a.action] ?? "Cambio registrado"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
        {section === "billing" && (
          <section className="card">
            <p>
              Esta organización aún no tiene una cuenta de facturación
              vinculada.
            </p>
            <p>La suscripción personal se administra por separado.</p>
            <Link prefetch={false} className="btn secondary" href="/profile">
              Ver mi suscripción personal
            </Link>
          </section>
        )}
      </main>
    </LocalizedContent>
  );
}
