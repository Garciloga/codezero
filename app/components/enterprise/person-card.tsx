import Link from "next/link";
import {
  initials,
  ORGANIZATION_ROLES,
  skillLabel,
  type summarizePerson,
} from "../../../lib/organization-metrics";
export type Person = ReturnType<typeof summarizePerson>;
export function SkillBars({
  skills,
}: {
  skills: { name: string; score: number | null }[];
}) {
  return (
    <>
      {!skills.length ? (
        <p>Aún no hay resultados</p>
      ) : (
        skills.map((s) => (
          <div className="vivo-skill" key={s.name}>
            <div className="label">
              <strong translate="no">{s.name}</strong>
              <span
                data-band={
                  s.score !== null && s.score >= 75
                    ? "strong"
                    : s.score !== null && s.score < 50
                      ? "weak"
                      : "progress"
                }
              >
                {skillLabel(s.score)}
                {s.score !== null && ` · ${s.score}%`}
              </span>
            </div>
            {s.score !== null && (
              <div
                className="bar"
                role="progressbar"
                aria-label={s.name}
                aria-valuenow={s.score}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <i style={{ display: "block", width: s.score + "%" }} />
              </div>
            )}
          </div>
        ))
      )}
    </>
  );
}
export default function PersonCard({
  person,
  org,
}: {
  person: Person;
  org: string;
}) {
  return (
    <article className="card vivo-person">
      <div className="vivo-person-header">
        <span className="vivo-avatar" aria-hidden="true">
          {initials(person.display_name)}
        </span>
        <div>
          <h3 translate="no">{person.display_name}</h3>
          <p className="muted">
            {person.job_title ? (
              <span translate="no">{person.job_title}</span>
            ) : (
              ORGANIZATION_ROLES[person.role]
            )}
          </p>
        </div>
      </div>
      <p>
        {person.level === null
          ? "Nivel aún no disponible"
          : `Nivel ${person.level} de 15`}
      </p>
      {person.percent !== null ? (
        <>
          <div
            className="bar"
            role="progressbar"
            aria-label={`Avance de ${person.display_name}`}
            aria-valuenow={person.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <i style={{ display: "block", width: person.percent + "%" }} />
          </div>
          <p>{person.percent}%</p>
        </>
      ) : (
        <p>Sin tareas asignadas</p>
      )}
      <p>
        Fuerte en:{" "}
        {person.strongest ? (
          <span translate="no">{person.strongest}</span>
        ) : (
          "Aún no hay resultados"
        )}
      </p>
      <p>
        Por reforzar:{" "}
        {person.weakest ? (
          <span translate="no">{person.weakest}</span>
        ) : (
          "Aún no hay resultados"
        )}
      </p>
      <span className={"vivo-chip" + (person.alert ? " alert" : "")}>
        {person.alert ??
          (person.pending
            ? person.pending === 1
              ? "1 pendiente"
              : `${person.pending} pendientes`
            : "Al día")}
      </span>
      <Link
        prefetch={false}
        className="btn secondary"
        href={`/teams/${org}/person/${person.user_id}`}
      >
        Ver ficha
      </Link>
    </article>
  );
}
